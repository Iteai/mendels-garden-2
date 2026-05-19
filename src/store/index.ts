// ─────────────────────────────────────────────
// src/store/index.ts
// Root store — combines all slices with Zustand
// ─────────────────────────────────────────────

import { create } from 'zustand';
import { createGardenSlice, type GardenSlice } from './gardenStore';
import { createInventorySlice, type InventorySlice } from './inventoryStore';
import { createSettingsSlice, type SettingsSlice } from './settingsStore';

// ─── Combined Store Type ──────────────────────

export type AppStore = GardenSlice & InventorySlice & SettingsSlice;

// ─── Store Instance ───────────────────────────

export const useAppStore = create<AppStore>()((...args) => ({
  ...createGardenSlice(...args),
  ...createInventorySlice(...args),
  ...createSettingsSlice(...args),
}));

// ─── Typed Selectors ──────────────────────────

// Garden
export const useGardenPlots  = () => useAppStore((s) => s.plots);
export const useGardenPlants = () => useAppStore((s) => s.plants);
export const usePlantById    = (id: string) => useAppStore((s) => s.plants[id] ?? null);
export const usePlotById     = (id: string) => useAppStore((s) => s.plots[id] ?? null);
export const useLastSimulatedAt = () => useAppStore((s) => s.lastSimulatedAt);

// Inventory
export const useSeeds    = () => useAppStore((s) => s.seeds);
export const useHarvests = () => useAppStore((s) => s.harvests);
export const useCurrency = () => useAppStore((s) => s.currency);
export const useSeedById = (id: string) => useAppStore((s) => s.seeds[id] ?? null);

// Settings
export const useSimulationSpeed      = () => useAppStore((s) => s.simulationSpeed);
export const useTutorialComplete     = () => useAppStore((s) => s.tutorialComplete);
export const useInventoryInitialised = () => useAppStore((s) => s.inventoryInitialised);

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
    compostPlant:        s.compostPlant,
    waterAllPlants:      s.waterAllPlants,
    feedAllPlants:       s.feedAllPlants,
    countThirstyPlants:  s.countThirstyPlants,
    countHungryPlants:   s.countHungryPlants,
  }));

export const useInventoryActions = () =>
  useAppStore((s) => ({
    addSeed:                  s.addSeed,
    removeSeed:               s.removeSeed,
    addHarvest:               s.addHarvest,
    removeHarvest:            s.removeHarvest,
    addCurrency:              s.addCurrency,
    spendCurrency:            s.spendCurrency,
    canAfford:                s.canAfford,
    initStartingInventory:    s.initStartingInventory,
    harvestPlant:             s.harvestPlant,
    buyWildSeed:              s.buyWildSeed,
    buyVarietySeed:           s.buyVarietySeed,
  }));

export const useSettingsActions = () =>
  useAppStore((s) => ({
    setSimulationSpeed:       s.setSimulationSpeed,
    setNotificationsEnabled:  s.setNotificationsEnabled,
    setSoundEnabled:          s.setSoundEnabled,
    completeTutorial:         s.completeTutorial,
    markInventoryInitialised: s.markInventoryInitialised,
  }));

// ─── Derived Selectors ────────────────────────

export const useOccupiedPlotCount = () =>
  useAppStore((s) =>
    Object.values(s.plots).filter((p) => p.state === 'occupied').length,
  );

export const useTotalSeedCount = () =>
  useAppStore((s) =>
    Object.values(s.seeds).reduce((sum, seed) => sum + seed.quantity, 0),
  );

export const usePlantsNeedingWater = () =>
  useAppStore((s) =>
    Object.values(s.plants).filter((p) => p.waterLevel < 0.3),
  );

export const usePlantsNeedingNutrients = () =>
  useAppStore((s) =>
    Object.values(s.plants).filter((p) => p.nutrientLevel < 0.25),
  );

export const useHarvestReadyPlants = () =>
  useAppStore((s) =>
    Object.values(s.plants).filter((p) => p.growthStage === 'harvest_ready'),
  );
