// ─────────────────────────────────────────────
// src/store/persistence.ts
// Phase 8 — AsyncStorage save/load/validate.
//
// Three-layer architecture:
//   1. raw serialisation to/from AsyncStorage
//   2. state validation (guards against corruption)
//   3. auto-save middleware for Zustand store
// ─────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  GardenState,
  InventoryState,
  SettingsState,
  PlantInstance,
  SeedItem,
  HarvestItem,
  GardenPlot,
} from '../types';

// ─── Storage Keys ────────────────────────────

const STORAGE_KEYS = {
  GARDEN:    '@plantgenetics/garden',
  INVENTORY: '@plantgenetics/inventory',
  SETTINGS:  '@plantgenetics/settings',
  SAVE_TIME: '@plantgenetics/lastSave',
} as const;

// ─── Save ────────────────────────────────────

export type PersistableState = {
  garden:    GardenState;
  inventory: InventoryState;
  settings:  SettingsState & { inventoryInitialised: boolean };
};

/**
 * Save all game state to AsyncStorage.
 * Runs in the background — safe to call synchronously.
 */
export async function saveGameState(state: PersistableState): Promise<void> {
  try {
    const saveTime = Date.now();
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.GARDEN, JSON.stringify(state.garden)),
      AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(state.inventory)),
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings)),
      AsyncStorage.setItem(STORAGE_KEYS.SAVE_TIME, JSON.stringify(saveTime)),
    ]);
  } catch (error) {
    if (__DEV__) console.warn('[Persistence] Save failed:', error);
  }
}

// ─── Load ────────────────────────────────────

export async function loadGameState(): Promise<PersistableState | null> {
  try {
    const [gardenRaw, inventoryRaw, settingsRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.GARDEN),
      AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
      AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
    ]);

    if (!gardenRaw || !inventoryRaw || !settingsRaw) return null;

    const garden: GardenState = JSON.parse(gardenRaw);
    const inventory: InventoryState = JSON.parse(inventoryRaw);
    const settings: SettingsState & { inventoryInitialised: boolean } = JSON.parse(settingsRaw);

    // Validate loaded state
    if (!validateState({ garden, inventory, settings })) {
      if (__DEV__) console.warn('[Persistence] State validation failed, discarding');
      return null;
    }

    return { garden, inventory, settings };
  } catch (error) {
    if (__DEV__) console.warn('[Persistence] Load failed:', error);
    return null;
  }
}

// ─── Clear ───────────────────────────────────

export async function clearSavedState(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.GARDEN),
      AsyncStorage.removeItem(STORAGE_KEYS.INVENTORY),
      AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
      AsyncStorage.removeItem(STORAGE_KEYS.SAVE_TIME),
    ]);
  } catch {
    // silent
  }
}

// ─── Validation ──────────────────────────────

function validateState(state: PersistableState): boolean {
  try {
    const { garden, inventory, settings } = state;

    // Garden plots must exist and have valid structure
    if (typeof garden.plots !== 'object' || garden.plots === null) return false;
    const plotIds = Object.keys(garden.plots);
    if (plotIds.length === 0) return false;

    for (const plotId of plotIds) {
      const plot = garden.plots[plotId] as GardenPlot | undefined;
      if (!plot || !plot.id || !['empty', 'occupied', 'locked'].includes(plot.state)) {
        return false;
      }
    }

    // Plants must have valid references
    if (typeof garden.plants !== 'object' || garden.plants === null) return false;
    for (const plant of Object.values(garden.plants) as PlantInstance[]) {
      if (!plant.id || !plant.speciesId || !plant.genotype || !plant.phenotype) {
        return false;
      }
      // Plot reference must exist
      if (plant.plotId && !garden.plots[plant.plotId]) {
        return false;
      }
    }

    // Seeds must have valid structure
    if (typeof inventory.seeds !== 'object' || inventory.seeds === null) return false;
    for (const seed of Object.values(inventory.seeds) as SeedItem[]) {
      if (!seed.id || !seed.speciesId || seed.quantity === undefined || seed.quantity < 0) {
        return false;
      }
    }

    // Currency must be valid
    if (typeof inventory.currency !== 'number' || inventory.currency < 0) return false;

    // Settings must be valid
    if (typeof settings.simulationSpeed !== 'number' || settings.simulationSpeed < 0.5) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ─── Auto-Save Middleware ────────────────────

type MiddlewareStore = {
  getState: () => PersistableState;
  setState: (fn: (state: PersistableState) => PersistableState) => void;
  subscribe: (listener: (state: PersistableState) => void) => () => void;
};

/**
 * Creates a debounced auto-save that persists state changes.
 * Throttles saves during rapid updates (e.g., simulation ticks).
 *
 * Usage: call autoSaveMiddleware(store) after store creation.
 * Returns an unsubscribe function.
 */
export function autoSaveMiddleware(
  store: MiddlewareStore,
  debounceMs = 500,
): () => void {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let lastSaveTime = 0;
  const MIN_SAVE_INTERVAL = 2000; // max 1 save per 2s during ticks

  const debouncedSave = () => {
    if (saveTimer) clearTimeout(saveTimer);

    const now = Date.now();
    const timeSinceLastSave = now - lastSaveTime;

    if (timeSinceLastSave >= MIN_SAVE_INTERVAL) {
      // Save immediately
      saveGameState({
        garden: store.getState().garden,
        inventory: store.getState().inventory,
        settings: store.getState().settings,
      });
      lastSaveTime = now;
    } else {
      // Debounce until enough time has passed
      saveTimer = setTimeout(() => {
        saveGameState({
          garden: store.getState().garden,
          inventory: store.getState().inventory,
          settings: store.getState().settings,
        });
        lastSaveTime = Date.now();
      }, Math.max(debounceMs, MIN_SAVE_INTERVAL - timeSinceLastSave));
    }
  };

  const unsubscribe = store.subscribe(debouncedSave);
  return unsubscribe;
}

// ─── Get last save timestamp ─────────────────

export async function getLastSaveTime(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SAVE_TIME);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}