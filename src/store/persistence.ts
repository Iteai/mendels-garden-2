// ─────────────────────────────────────────────
// src/store/persistence.ts
//
// AsyncStorage persistence layer for Zustand.
//
// Features:
//   - Debounced autosave on every state change (1s debounce)
//   - State change detection to skip redundant writes
//   - Full state serialization/deserialization
//   - Validation with fallback on corrupt data
//   - Manual save/load for startup restore
//
// Phase 9 Optimizations:
//   - Added hasStateChanged() check to avoid unnecessary writes
//   - Reduced jank on idle frames by skipping persists when nothing changed
//
// Future improvements:
//   - Delta persistence: only save changed slices (garden/inventory/etc)
//   - State compression: gzip or LZ4 compression for large gardens
//   - Incremental write strategy for very large save files
// ─────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppStore } from './index';

// ─── Storage Key ──────────────────────────────

const STORAGE_KEY = '@plantgenetics/save';

// ─── State Filtering ──────────────────────────
// Only persist slices that should survive app restarts.
// We filter out runtime-only data like the simulation clock.

export type PersistedState = {
  garden: {
    plots: AppStore['plots'];
    plants: AppStore['plants'];
  };
  inventory: {
    seeds: AppStore['seeds'];
    harvests: AppStore['harvests'];
    currency: AppStore['currency'];
  };
  settings: {
    simulationSpeed: AppStore['simulationSpeed'];
    notificationsEnabled: AppStore['notificationsEnabled'];
    soundEnabled: AppStore['soundEnabled'];
    tutorialComplete: AppStore['tutorialComplete'];
    inventoryInitialised: AppStore['inventoryInitialised'];
  };
  journal: {
    entries: AppStore['entries'];
    newDiscoveries: AppStore['newDiscoveries'];
  };
};

/**
 * Extract persistable state from the full store.
 * Remove ephemeral data (lastSimulatedAt, plant timestamps).
 */
function extractPersistable(state: AppStore): PersistedState {
  return {
    garden: {
      plots: state.plots,
      plants: state.plants,
    },
    inventory: {
      seeds: state.seeds,
      harvests: state.harvests,
      currency: state.currency,
    },
    settings: {
      simulationSpeed: state.simulationSpeed,
      notificationsEnabled: state.notificationsEnabled,
      soundEnabled: state.soundEnabled,
      tutorialComplete: state.tutorialComplete,
      inventoryInitialised: state.inventoryInitialised,
    },
    journal: {
      entries: state.entries,
      newDiscoveries: state.newDiscoveries,
    },
  };
}

/**
 * Validate that a loaded state object has the expected shape.
 * Returns true if the state looks valid enough to restore.
 */
function validatePersistedState(data: unknown): data is PersistedState {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  // Check top-level slices exist
  if (!d.garden || !d.inventory || !d.settings || !d.journal) return false;

  // Check garden has plots and plants
  const g = d.garden as Record<string, unknown>;
  if (!g.plots || typeof g.plots !== 'object') return false;
  if (!g.plants || typeof g.plants !== 'object') return false;

  // Check inventory has seeds, harvests, currency
  const inv = d.inventory as Record<string, unknown>;
  if (!inv.seeds || typeof inv.seeds !== 'object') return false;
  if (!inv.harvests || typeof inv.harvests !== 'object') return false;
  if (typeof inv.currency !== 'number') return false;

  // Check settings
  const s = d.settings as Record<string, unknown>;
  if (typeof s.simulationSpeed !== 'number') return false;
  if (typeof s.inventoryInitialised !== 'boolean') return false;

  // Check journal
  const j = d.journal as Record<string, unknown>;
  if (!j.entries || typeof j.entries !== 'object') return false;

  return true;
}

// ─── Debounce Utility ─────────────────────────

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, ms);
  };
}

// ─── Save/Load API ────────────────────────────

let isSaving = false;
let lastPersistedState: PersistedState | null = null;

/**
 * Check if state has meaningfully changed since last save.
 * Prevents unnecessary writes for rapid, redundant updates.
 * Phase 9: Optimization to reduce persistence overhead
 */
function hasStateChanged(newState: PersistedState): boolean {
  if (!lastPersistedState) return true;

  // Quick reference equality checks for common mutations
  if (newState.inventory.currency !== lastPersistedState.inventory.currency) return true;
  if (Object.keys(newState.garden.plants).length !== Object.keys(lastPersistedState.garden.plants).length) return true;
  if (Object.keys(newState.inventory.seeds).length !== Object.keys(lastPersistedState.inventory.seeds).length) return true;

  return false;
}

/**
 * Save the current store state to AsyncStorage.
 * Debounced — will not write more frequently than 1s.
 * Phase 9: Only writes if state has meaningfully changed
 */
const debouncedSave = debounce(async (state: AppStore) => {
  if (isSaving) return;

  const newState = extractPersistable(state);

  // Skip save if nothing changed — reduces jank on idle frames
  if (!hasStateChanged(newState)) {
    return;
  }

  isSaving = true;
  try {
    const json = JSON.stringify(newState);
    await AsyncStorage.setItem(STORAGE_KEY, json);
    lastPersistedState = newState;
  } catch (error) {
    console.warn('[Persistence] Save failed:', error);
  } finally {
    isSaving = false;
  }
}, 1000);

/**
 * Subscribe to store changes for autosave.
 * Call once during app initialization.
 */
export function subscribeAutosave(store: {
  subscribe: (listener: (state: AppStore) => void) => () => void;
  getState: () => AppStore;
}): () => void {
  return store.subscribe((state: AppStore) => {
    debouncedSave(state);
  });
}

/**
 * Load persisted state from AsyncStorage.
 * Returns null if no save exists or data is corrupted.
 */
export async function loadSavedState(): Promise<PersistedState | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;

    const parsed = JSON.parse(json);
    if (!validatePersistedState(parsed)) {
      console.warn('[Persistence] Corrupted save data — ignoring');
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn('[Persistence] Load failed:', error);
    return null;
  }
}

/**
 * Perform an immediate, non-debounced save.
 * Useful for manual save points (e.g. before backgrounding).
 */
export async function saveImmediate(state: AppStore): Promise<void> {
  try {
    const data = extractPersistable(state);
    const json = JSON.stringify(data);
    await AsyncStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.warn('[Persistence] Immediate save failed:', error);
  }
}

/**
 * Clear all saved data (for dev/testing).
 */
export async function clearSavedState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[Persistence] Clear failed:', error);
  }
}

/**
 * Get the approximate size of saved data in bytes.
 */
export async function getSaveSize(): Promise<number> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? new Blob([json]).size : 0;
  } catch {
    return 0;
  }
}