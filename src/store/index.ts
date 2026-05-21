// ─────────────────────────────────────────────
// src/store/index.ts
// Root store — combines all slices with Zustand
// Phase 9: stable selectors + async tick action
// ─────────────────────────────────────────────

import { useMemo } from 'react';
import { create } from 'zustand';
import { createGardenSlice, type GardenSlice } from './gardenStore';
import { createInventorySlice, type InventorySlice } from './inventoryStore';
import { createSettingsSlice, type SettingsSlice } from './settingsStore';
import type { PlantInstance, SeedItem, HarvestItem } from '../types';

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
    initGarden:            s.initGarden,
    unlockPlot:            s.unlockPlot,
    plantSeed:             s.plantSeed,
    waterPlant:            s.waterPlant,
    addNutrients:          s.addNutrients,
    tickSimulation:        s.tickSimulation,
    tickSimulationAsync:   s.tickSimulationAsync,  // Phase 9
    setLastSimulatedAt:    s.setLastSimulatedAt,
    removePlant:           s.removePlant,
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

// ─── Derived Selectors (original) ────────────
// Kept for backward compat — prefer *Stable variants in new code.

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

export const useHarvestReadyPlants = () =>
  useAppStore((s) =>
    Object.values(s.plants).filter((p) => p.growthStage === 'harvest_ready'),
  );

// ─── Phase 9: Stable Derived Selectors ───────
// These use useMemo so the returned array reference is stable
// as long as the upstream record identity hasn't changed.
// This prevents SimulationLoop ticks from cascading re-renders
// into components that subscribe to array-returning selectors.

/**
 * Stable variant — memoises filter result against the plants map.
 * Re-renders component only when plants map identity changes.
 */
export function usePlantsNeedingWaterStable(): PlantInstance[] {
  const plants = useAppStore((s) => s.plants);
  return useMemo(
    () => Object.values(plants).filter((p) => p.waterLevel < 0.3),
    [plants],
  );
}

/**
 * Stable variant — memoises harvest-ready filter.
 */
export function useHarvestReadyPlantsStable(): PlantInstance[] {
  const plants = useAppStore((s) => s.plants);
  return useMemo(
    () => Object.values(plants).filter((p) => p.growthStage === 'harvest_ready'),
    [plants],
  );
}

/**
 * Stable occupied plot count — scalar, never false re-renders.
 */
export function useOccupiedPlotCountStable(): number {
  return useAppStore((s) =>
    Object.values(s.plots).filter((p) => p.state === 'occupied').length,
  );
}

/**
 * Stable harvest list sorted newest-first.
 * Re-renders only when harvests map identity changes.
 */
export function useHarvestListStable(): HarvestItem[] {
  const harvests = useAppStore((s) => s.harvests);
  return useMemo(
    () => Object.values(harvests).sort((a, b) => b.harvestedAt - a.harvestedAt),
    [harvests],
  );
}

/**
 * Stable total seed count — scalar.
 */
export function useTotalSeedCountStable(): number {
  return useAppStore((s) =>
    Object.values(s.seeds).reduce((sum: number, seed: SeedItem) => sum + seed.quantity, 0),
  );
}

/**
 * Stable seed list sorted by rarity.
 * Re-renders only when seeds map identity changes.
 */
export function useSeedListStable(): SeedItem[] {
  const seeds = useAppStore((s) => s.seeds);
  return useMemo(
    () =>
      Object.values(seeds).sort(
        (a, b) => b.phenotype.rarityScore - a.phenotype.rarityScore,
      ),
    [seeds],
  );
}
