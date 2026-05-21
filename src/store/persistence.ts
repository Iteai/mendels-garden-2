// ─────────────────────────────────────────────
// src/store/persistence.ts
// AsyncStorage save / restore for game state
// Phase 8: initial implementation
// Phase 9: dirty-flag optimisation — skip serialisation when
//           no meaningful slice has changed since last save.
// ─────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage key ──────────────────────────────

const SAVE_KEY = '@plantgenetics/save_v1';

// ─── Saved State Shape ────────────────────────

type SavedState = {
  garden: {
    plots:           unknown;
    plants:          unknown;
    lastSimulatedAt: number;
  };
  inventory: {
    seeds:    unknown;
    harvests: unknown;
    currency: number;
  };
  settings: {
    simulationSpeed:      number;
    notificationsEnabled: boolean;
    soundEnabled:         boolean;
    tutorialComplete:     boolean;
    inventoryInitialised: boolean;
  };
  savedAt: number;
};

// ─── Save / Load ──────────────────────────────

export async function saveGameState(state: unknown): Promise<void> {
  try {
    const s = state as any;

    const saved: SavedState = {
      garden: {
        plots:           s.plots,
        plants:          s.plants,
        lastSimulatedAt: s.lastSimulatedAt,
      },
      inventory: {
        seeds:    s.seeds,
        harvests: s.harvests,
        currency: s.currency,
      },
      settings: {
        simulationSpeed:      s.simulationSpeed,
        notificationsEnabled: s.notificationsEnabled,
        soundEnabled:         s.soundEnabled,
        tutorialComplete:     s.tutorialComplete,
        inventoryInitialised: s.inventoryInitialised,
      },
      savedAt: Date.now(),
    };

    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(saved));
  } catch (e) {
    if (__DEV__) console.warn('[Persistence] Save failed:', e);
  }
}

export async function loadGameState(): Promise<SavedState | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch (e) {
    if (__DEV__) console.warn('[Persistence] Load failed:', e);
    return null;
  }
}

// ─── Auto-save Middleware (Phase 9 optimised) ─
//
// Problem (Phase 8): The middleware subscribed to the Zustand
// store and saved on every state change — including every
// simulation tick that touches plants.water / plants.health.
// This caused JSON.stringify() to run 12×/min at 1× speed.
//
// Solution (Phase 9):
//   1. Track "dirty" slices — only save when garden, inventory,
//      or settings identity has changed since last save.
//   2. Debounce saves to 3s so rapid changes are batched.
//   3. Read state once per save cycle (no double getState()).
//   4. Skip serialisation entirely when nothing is dirty.

const SAVE_DEBOUNCE_MS = 3000; // min time between saves

type StoreHandle = {
  getState:  () => unknown;
  setState:  (partial: unknown) => void;
  subscribe: (listener: (state: unknown) => void) => () => void;
};

export function autoSaveMiddleware(store: StoreHandle): () => void {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  // Phase 9 slice-identity tracking — only the three top-level
  // record references we care about: plants, seeds, harvests.
  // Settings fields are primitives so we compare by value.
  let lastPlants:   unknown = null;
  let lastSeeds:    unknown = null;
  let lastHarvests: unknown = null;
  let lastCurrency: unknown = null;
  let lastSettings: string  = '';

  function scheduleSave() {
    if (saveTimer !== null) return; // already scheduled
    saveTimer = setTimeout(() => {
      saveTimer = null;
      // Read current state at fire-time, not at schedule-time.
      // All changes that occurred during the 3s debounce window are included.
      performSave(store.getState());
    }, SAVE_DEBOUNCE_MS);
  }

  function performSave(state: unknown) {
    const s = state as any;

    // Phase 9: skip serialisation if nothing relevant changed
    const settingsSnapshot = `${s.simulationSpeed}|${s.notificationsEnabled}|${s.soundEnabled}|${s.tutorialComplete}|${s.inventoryInitialised}`;

    const dirty =
      s.plants   !== lastPlants   ||
      s.seeds    !== lastSeeds    ||
      s.harvests !== lastHarvests ||
      s.currency !== lastCurrency ||
      settingsSnapshot !== lastSettings;

    if (!dirty) return;

    // Update sentinels before async save to avoid duplicate saves
    lastPlants   = s.plants;
    lastSeeds    = s.seeds;
    lastHarvests = s.harvests;
    lastCurrency = s.currency;
    lastSettings = settingsSnapshot;

    // Read state once — no double getState()
    saveGameState(state);
  }

  const unsubscribe = store.subscribe(() => {
    scheduleSave();
  });

  return unsubscribe;
}
