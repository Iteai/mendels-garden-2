// ─────────────────────────────────────────────
// src/store/gardenStore.ts
// Garden state: plots, living plants, simulation clock
// Phase 4: tickSimulation wired to simulationCore
// ─────────────────────────────────────────────

import { StateCreator } from 'zustand';
import type {
  GardenState, GardenPlot, PlantInstance,
  SpeciesId, Genotype, Phenotype,
} from '../types';
import { GAME } from '../constants/theme';
import { simulatePlants, type SimulationEvent } from '../simulation';

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
    const plot = get().plots[plotId];
    if (!plot || plot.state !== 'empty') return null;

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

  // ── Simulation tick (Phase 4) ─────────────
  // Delegates entirely to simulatePlants() — a pure function.
  // Returns collected SimulationEvents for the caller to act on
  // (notifications, UI badges, etc.).

  tickSimulation: (elapsedTicks) => {
    const capped = Math.min(Math.floor(elapsedTicks), GAME.OFFLINE_CATCH_UP_CAP_TICKS);
    if (capped <= 0) return [];

    const currentPlants = get().plants;
    if (Object.keys(currentPlants).length === 0) return [];

    const { plants: updatedPlants, allEvents } = simulatePlants(currentPlants, capped);

    set({ plants: updatedPlants });
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
