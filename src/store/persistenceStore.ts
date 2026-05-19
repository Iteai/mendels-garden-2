// ─────────────────────────────────────────────
// src/store/persistenceStore.ts
// AsyncStorage persistence layer for Zustand
// Phase 8: Autosave, restore on startup, validation
// ─────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppStore } from './index';

const SAVE_KEY = 'plantgenetics_save_v1';

// ─── Autosave interval ────────────────────────

const AUTOSAVE_INTERVAL_MS = 30_000; // 30s

let autosaveTimer: ReturnType<typeof setInterval> | null = null;

// ─── State serialisation ──────────────────────

export type SaveData = {
  version: number;
  savedAt: number;
  garden: {
    plots: AppStore['plots'];
    plants: AppStore['plants'];
    lastSimulatedAt: number;
  };
  inventory: {
    seeds: AppStore['seeds'];
    harvests: AppStore['harvests'];
    currency: AppStore['currency'];
  };
  settings: {
    simulationSpeed: number;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    tutorialComplete: boolean;
    inventoryInitialised: boolean;
  };
};

const SAVE_VERSION = 1;

function serialize(getState: () => AppStore): SaveData {
  const s = getState();
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    garden: {
      plots: s.plots,
      plants: s.plants,
      lastSimulatedAt: s.lastSimulatedAt,
    },
    inventory: {
      seeds: s.seeds,
      harvests: s.harvests,
      currency: s.currency,
    },
    settings: {
      simulationSpeed: s.simulationSpeed,
      notificationsEnabled: s.notificationsEnabled,
      soundEnabled: s.soundEnabled,
      tutorialComplete: s.tutorialComplete,
      inventoryInitialised: s.inventoryInitialised,
    },
  };
}

function deserialize(data: SaveData): Partial<AppStore> {
  return {
    plots: data.garden.plots,
    plants: data.garden.plants,
    lastSimulatedAt: data.garden.lastSimulatedAt,
    seeds: data.inventory.seeds,
    harvests: data.inventory.harvests,
    currency: data.inventory.currency,
    simulationSpeed: data.settings.simulationSpeed,
    notificationsEnabled: data.settings.notificationsEnabled,
    soundEnabled: data.settings.soundEnabled,
    tutorialComplete: data.settings.tutorialComplete,
    inventoryInitialised: data.settings.inventoryInitialised,
  };
}

// ─── Validation ───────────────────────────────

function validateSaveData(data: unknown): data is SaveData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (d.version !== SAVE_VERSION) return false;
  if (!d.garden || typeof d.garden !== 'object') return false;
  if (!d.inventory || typeof d.inventory !== 'object') return false;
  if (!d.settings || typeof d.settings !== 'object') return false;
  return true;
}

// ─── Public API ───────────────────────────────

/**
 * Save current state to AsyncStorage.
 */
export async function saveGame(getState: () => AppStore): Promise<boolean> {
  try {
    const data = serialize(getState);
    const json = JSON.stringify(data);
    await AsyncStorage.setItem(SAVE_KEY, json);
    return true;
  } catch (err) {
    console.warn('[Save] Failed:', err);
    return false;
  }
}

/**
 * Load saved state from AsyncStorage.
 * Returns null if no save exists or validation fails.
 */
export async function loadGame(): Promise<Partial<AppStore> | null> {
  try {
    const json = await AsyncStorage.getItem(SAVE_KEY);
    if (!json) return null;

    const parsed: unknown = JSON.parse(json);
    if (!validateSaveData(parsed)) {
      console.warn('[Save] Invalid save data — starting fresh');
      return null;
    }

    return deserialize(parsed);
  } catch (err) {
    console.warn('[Save] Load failed:', err);
    return null;
  }
}

/**
 * Delete all saved data.
 */
export async function deleteSave(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.warn('[Save] Delete failed:', err);
  }
}

/**
 * Start autosave timer. Clears any existing timer first.
 */
export function startAutosave(getState: () => AppStore): void {
  stopAutosave();
  autosaveTimer = setInterval(() => {
    saveGame(getState);
  }, AUTOSAVE_INTERVAL_MS);
}

/**
 * Stop the autosave timer.
 */
export function stopAutosave(): void {
  if (autosaveTimer) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
}

/**
 * Get the last saved timestamp from storage (quick check).
 */
export async function getLastSaveTimestamp(): Promise<number | null> {
  try {
    const json = await AsyncStorage.getItem(SAVE_KEY);
    if (!json) return null;
    const data: SaveData = JSON.parse(json);
    return data.savedAt ?? null;
  } catch {
    return null;
  }
}