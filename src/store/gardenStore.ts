// ─────────────────────────────────────────────
// src/store/gardenStore.ts
// Garden state: plots, living plants, simulation clock
// Phase 4: tickSimulation wired to simulationCore
// Phase 9: plant cap, dead-plant GC, chunked offline sim
// ─────────────────────────────────────────────

import { StateCreator } from 'zustand';
import type {
  GardenState, GardenPlot, PlantInstance,
  SpeciesId, Genotype, Phenotype,
} from '../types';
import { GAME } from '../constants/theme';
import {
  simulatePlants,
  simulatePlantsChunked,
  type SimulationEvent,
} from '../simulation';

// ─── Helpers ──────────────────────────────────

function createInitialPlots(): Record<string, GardenPlot> {
  const plots: Record<string, GardenPlot> = {};
  for (let row = 0; row < GAME.GARDEN_ROWS; row++) {
    for (let col = 0; col < GAME.GARDEN_COLS; col++) {
      const id    = `plot_${row}_${col}`;
      const index = row * GAME.GARDEN_COLS + col;
      plots[id] = {
        id,
        state:       index < GAME.INITIAL_UNLOCKED_PLOTS ? 'empty' : 'locked',
        plantId:     null,
        soilQuality: 0.70 + Math.random() * 0.30,
        position:    { row, col },
      };
    }
  }
  return plots;
}

function generatePlantId(): string {
  return `plant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Prune plants that have been dead for more than DEAD_PLANT_PRUNE_TICKS.
 * Also frees the associated plot slot.
 * Returns a new plants + plots record (only allocates if something changed).
 */
function pruneDeadPlants(
  plants: Record<string, PlantInstance>,
  plots:  Record<string, GardenPlot>,
): { plants: Record<string, PlantInstance>; plots: Record<string, GardenPlot> } | null {
  const toPrune: string[] = [];

  for (const id in plants) {
    const p = plants[id];
    if (p.growthStage === 'dead' && p.age > GAME.DEAD_PLANT_PRUNE_TICKS) {
      toPrune.push(id);
    }
  }

  if (toPrune.length === 0) return null; // nothing to do — avoid allocation

  const newPlants = { ...plants };
  const newPlots  = { ...plots };

  for (const id of toPrune) {
    const plant = plants[id];
    delete newPlants[id];
    if (plant.plotId && newPlots[plant.plotId]) {
      newPlots[plant.plotId] = {
        ...newPlots[plant.plotId],
        state:   'empty',
        plantId: null,
      };
    }
  }

  return { plants: newPlants, plots: newPlots };
}

// ─── Initial State ────────────────────────────

const initialGardenState: GardenState = {
  plots:            {},
  plants:           {},
  lastSimulatedAt:  Date.now(),
};

// ─── Actions ──────────────────────────────────

export type GardenActions = {
  initGarden:          () => void;
  unlockPlot:          (plotId: string) => void;
  plantSeed:           (params: {
    plotId:     string;
    speciesId:  SpeciesId;
    genotype:   Genotype;
    phenotype:  Phenotype;
    parentIds?: [string | null, string | null];
    generation?: number;
  }) => PlantInstance | null;
  waterPlant:          (plantId: string, amount: number) => void;
  addNutrients:        (plantId: string, amount: number) => void;
  tickSimulation:      (elapsedTicks: number) => SimulationEvent[];
  /** Async variant — used for large offline catch-ups to avoid blocking the JS thread */
  tickSimulationAsync: (elapsedTicks: number) => Promise<SimulationEvent[]>;
  setLastSimulatedAt:  (timestamp: number) => void;
  removePlant:         (plantId: string) => void;
};

export type GardenSlice = GardenState & GardenActions;

// ─── Slice Creator ────────────────────────────

export const createGardenSlice: StateCreator<
  GardenSlice, [], [], GardenSlice
> = (set, get) => ({
  ...initialGardenState,

  // ── Garden setup ──────────────────────────

  initGarden: () => {
    if (Object.keys(get().plots).length === 0) {
      set({ plots: createInitialPlots() });
    }
  },

  unlockPlot: (plotId) => {
    set((s) => ({
      plots: { ...s.plots, [plotId]: { ...s.plots[plotId], state: 'empty' } },
    }));
  },

  // ── Plant seed ────────────────────────────

  plantSeed: ({ plotId, speciesId, genotype, phenotype, parentIds, generation }) => {
    const state = get();
    const plot  = state.plots[plotId];
    if (!plot || plot.state !== 'empty') return null;

    // Phase 9: enforce plant cap — count only living plants
    const livingCount = Object.values(state.plants).filter(
      (p) => p.growthStage !== 'dead',
    ).length;
    if (livingCount >= GAME.PLANT_CAP) return null;

    const now     = Date.now();
    const plantId = generatePlantId();

    const newPlant: PlantInstance = {
      id:             plantId,
      speciesId,
      genotype,
      phenotype,
      growthStage:    'seed',
      growthProgress: 0,
      age:            0,
      health:         'healthy',
      healthValue:    0.82,
      waterLevel:     0.72,
      lightLevel:     0.80,
      nutrientLevel:  0.62,
      plotId,
      plantedAt:      now,
      lastUpdatedAt:  now,
      parentIds:      parentIds ?? [null, null],
      generation:     generation ?? 0,
    };

    set((s) => ({
      plants: { ...s.plants, [plantId]: newPlant },
      plots:  { ...s.plots,  [plotId]:  { ...s.plots[plotId], state: 'occupied', plantId } },
    }));

    return newPlant;
  },

  // ── Resources ─────────────────────────────

  waterPlant: (plantId, amount) => {
    set((s) => {
      const plant = s.plants[plantId];
      if (!plant) return s;
      const newWater = Math.min(1, plant.waterLevel + amount);
      return {
        plants: {
          ...s.plants,
          [plantId]: {
            ...plant,
            waterLevel:   newWater,
            lastUpdatedAt: Date.now(),
          },
        },
      };
    });
  },

  addNutrients: (plantId, amount) => {
    set((s) => {
      const plant = s.plants[plantId];
      if (!plant) return s;
      return {
        plants: {
          ...s.plants,
          [plantId]: {
            ...plant,
            nutrientLevel: Math.min(1, plant.nutrientLevel + amount),
            lastUpdatedAt: Date.now(),
          },
        },
      };
    });
  },

  // ── Simulation tick (synchronous) ─────────
  // Delegates to simulatePlants() — a pure function.
  // Also prunes dead plants after each batch (Phase 9).

  tickSimulation: (elapsedTicks) => {
    const capped = Math.min(Math.floor(elapsedTicks), GAME.OFFLINE_CATCH_UP_CAP_TICKS);
    if (capped <= 0) return [];

    const currentPlants = get().plants;
    if (Object.keys(currentPlants).length === 0) return [];

    const { plants: updatedPlants, allEvents } = simulatePlants(currentPlants, capped);

    // Phase 9: prune stale dead plants after simulation
    const pruned = pruneDeadPlants(updatedPlants, get().plots);
    if (pruned) {
      set({ plants: pruned.plants, plots: pruned.plots });
    } else {
      set({ plants: updatedPlants });
    }

    return allEvents;
  },

  // ── Simulation tick (async, chunked) ──────
  // Phase 9: for large offline catch-ups (many plants × many ticks)
  // this avoids blocking the JS thread by chunking work.
  // Used by app/_layout.tsx on startup when elapsedTicks is large.

  tickSimulationAsync: async (elapsedTicks) => {
    const capped = Math.min(Math.floor(elapsedTicks), GAME.OFFLINE_CATCH_UP_CAP_TICKS);
    if (capped <= 0) return [];

    const currentPlants = get().plants;
    const plantCount = Object.keys(currentPlants).length;
    if (plantCount === 0) return [];

    // For large batches use chunked; for small batches synchronous is faster
    const shouldChunk = plantCount > GAME.SIM_CHUNK_SIZE || capped > 100;

    let updatedPlants: Record<string, PlantInstance>;
    let allEvents: SimulationEvent[];

    if (shouldChunk) {
      const result = await simulatePlantsChunked(
        currentPlants,
        capped,
        GAME.SIM_CHUNK_SIZE,
      );
      updatedPlants = result.plants;
      allEvents     = result.allEvents;
    } else {
      const result = simulatePlants(currentPlants, capped);
      updatedPlants = result.plants;
      allEvents     = result.allEvents;
    }

    // Prune stale dead plants
    const pruned = pruneDeadPlants(updatedPlants, get().plots);
    if (pruned) {
      set({ plants: pruned.plants, plots: pruned.plots });
    } else {
      set({ plants: updatedPlants });
    }

    return allEvents;
  },

  setLastSimulatedAt: (timestamp) => set({ lastSimulatedAt: timestamp }),

  // ── Remove plant ──────────────────────────

  removePlant: (plantId) => {
    set((s) => {
      const plant = s.plants[plantId];
      if (!plant) return s;

      const updatedPlants = { ...s.plants };
      delete updatedPlants[plantId];

      return {
        plants: updatedPlants,
        plots:  {
          ...s.plots,
          [plant.plotId]: {
            ...s.plots[plant.plotId],
            state:   'empty',
            plantId: null,
          },
        },
      };
    });
  },
});
