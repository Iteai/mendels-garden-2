// ─────────────────────────────────────────────
// src/store/index.ts
// Root store — combines all slices with Zustand
// ─────────────────────────────────────────────

import { create } from 'zustand';
import { createGardenSlice, type GardenSlice } from './gardenStore';
import { createInventorySlice, type InventorySlice } from './inventoryStore';
import { createSettingsSlice, type SettingsSlice } from './settingsStore';
import { createJournalSlice, type JournalSlice } from './journalStore';
import { shallowEqual } from '../utils/formatters';

// ─── Combined Store Type ──────────────────────

export type AppStore = GardenSlice & InventorySlice & SettingsSlice & JournalSlice;

// ─── Store Instance ───────────────────────────

export const useAppStore = create<AppStore>()((...args) => ({
  ...createGardenSlice(...args),
  ...createInventorySlice(...args),
  ...createSettingsSlice(...args),
  ...createJournalSlice(...args),
}));

// ─── Typed Selectors ──────────────────────────
// Phase 9: Optimized selectors with proper equality checks

// Garden
export const useGardenPlots  = () => useAppStore((s) => s.plots);
export const useGardenPlants = () => useAppStore((s) => s.plants);
export const usePlantById    = (id: string) => useAppStore((s) => s.plants[id] ?? null);
export const usePlotById     = (id: string) => useAppStore((s) => s.plots[id] ?? null);
export const useLastSimulatedAt = () => useAppStore(
  (s) => s.lastSimulatedAt,
  (a, b) => a === b  // Numeric timestamp comparison
);

// Inventory
export const useSeeds    = () => useAppStore((s) => s.seeds);
export const useHarvests = () => useAppStore((s) => s.harvests);
export const useCurrency = () => useAppStore(
  (s) => s.currency,
  (a, b) => a === b  // Numeric comparison
);
export const useSeedById = (id: string) => useAppStore((s) => s.seeds[id] ?? null);

// Settings
export const useSimulationSpeed      = () => useAppStore(
  (s) => s.simulationSpeed,
  (a, b) => a === b  // Numeric comparison
);
export const useTutorialComplete     = () => useAppStore(
  (s) => s.tutorialComplete,
  (a, b) => a === b  // Boolean comparison
);
export const useInventoryInitialised = () => useAppStore(
  (s) => s.inventoryInitialised,
  (a, b) => a === b  // Boolean comparison
);

// Journal
export const useJournalEntries       = () => useAppStore((s) => s.entries);
export const useNewDiscoveries       = () => useAppStore((s) => s.newDiscoveries);
export const useDiscoveredCount      = () => useAppStore(
  (s) => Object.keys(s.entries).length,
  (a, b) => a === b  // Numeric comparison
);

// ─── Action Hooks ─────────────────────────────

export const useGardenActions = () =>
  useAppStore((s) => ({
    initGarden:          s.initGarden,
    unlockPlot:          s.unlockPlot,
    plantSeed:           s.plantSeed,
    waterPlant:          s.waterPlant,
    addNutrients:        s.addNutrients,
    tickSimulation:      s.tickSimulation,
    setLastSimulatedAt:  s.setLastSimulatedAt,
    removePlant:         s.removePlant,
  }));

export const useInventoryActions = () =>
  useAppStore((s) => ({
    addSeed:                  s.addSeed,
    removeSeed:               s.removeSeed,
    addHarvest:               s.addHarvest,
    removeHarvest:            s.removeHarvest,
    addCurrency:              s.addCurrency,
    spendCurrency:            s.spendCurrency,
    initStartingInventory:    s.initStartingInventory,
  }));

export const useSettingsActions = () =>
  useAppStore((s) => ({
    setSimulationSpeed:       s.setSimulationSpeed,
    setNotificationsEnabled:  s.setNotificationsEnabled,
    setSoundEnabled:          s.setSoundEnabled,
    completeTutorial:         s.completeTutorial,
    markInventoryInitialised: s.markInventoryInitialised,
  }));

export const useJournalActions = () =>
  useAppStore((s) => ({
    recordDiscovery:    s.recordDiscovery,
    clearNewDiscoveries: s.clearNewDiscoveries,
    resetJournal:       s.resetJournal,
  }));

// ─── Derived Selectors ────────────────────────
// Phase 9: Optimized with shallow equality to prevent unnecessary re-renders

export const useOccupiedPlotCount = () =>
  useAppStore(
    (s) => Object.values(s.plots).filter((p) => p.state === 'occupied').length,
    (a, b) => a === b  // Numeric comparison, no need for shallow equal
  );

export const useTotalSeedCount = () =>
  useAppStore(
    (s) => Object.values(s.seeds).reduce((sum, seed) => sum + seed.quantity, 0),
    (a, b) => a === b  // Numeric comparison
  );

/**
 * Get all plants that need water (waterLevel < 0.3).
 * Uses shallow equality to prevent re-renders when plant list is stable.
 */
export const usePlantsNeedingWater = () =>
  useAppStore(
    (s) => Object.values(s.plants).filter((p) => p.waterLevel < 0.3),
    (a, b) => {
      if (a.length !== b.length) return false;
      // Compare arrays by reference equality of elements
      return a.every((plant, i) => plant === b[i]);
    }
  );

/**
 * Get all plants ready for harvest.
 * Uses shallow equality to prevent re-renders when harvest-ready list is stable.
 */
export const useHarvestReadyPlants = () =>
  useAppStore(
    (s) => Object.values(s.plants).filter((p) => p.growthStage === 'harvest_ready'),
    (a, b) => {
      if (a.length !== b.length) return false;
      // Compare arrays by reference equality of elements
      return a.every((plant, i) => plant === b[i]);
    }
  );