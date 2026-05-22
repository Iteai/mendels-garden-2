// ─────────────────────────────────────────────
// src/store/inventoryStore.ts
// Inventory state: seeds, harvests, currency
// FIX: initStartingInventory with fallback manuale
// ─────────────────────────────────────────────

import { StateCreator } from 'zustand';
import type {
  InventoryState,
  SeedItem,
  HarvestItem,
  SeedRarity,
} from '../types';
import { GAME } from '../constants/theme';

// ─── Rarity Computation ───────────────────────

export function computeRarity(rarityScore: number): SeedRarity {
  if (rarityScore >= GAME.RARITY_LEGENDARY) return 'legendary';
  if (rarityScore >= GAME.RARITY_RARE)      return 'rare';
  if (rarityScore >= GAME.RARITY_UNCOMMON)  return 'uncommon';
  return 'common';
}

// ─── ID helpers ───────────────────────────────

function generateSeedId(): string {
  return `seed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateHarvestId(): string {
  return `harvest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Slice Actions ────────────────────────────

export type InventoryActions = {
  addSeed: (seed: Omit<SeedItem, 'id' | 'obtainedAt'>) => string;
  removeSeed: (seedId: string, quantity?: number) => void;
  addHarvest: (harvest: Omit<HarvestItem, 'id' | 'harvestedAt'>) => string;
  removeHarvest: (harvestId: string) => void;
  addCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  addSeedBatch: (seeds: Array<Omit<SeedItem, 'id' | 'obtainedAt'>>) => string[];
  initStartingInventory: () => void;
};

// ─── Initial State ────────────────────────────

const initialInventoryState: InventoryState = {
  seeds: {},
  harvests: {},
  currency: GAME.STARTING_CURRENCY,
};

// ─── Slice Creator ────────────────────────────

export type InventorySlice = InventoryState & InventoryActions;

export const createInventorySlice: StateCreator<
  InventorySlice,
  [],
  [],
  InventorySlice
> = (set, get) => ({
  ...initialInventoryState,

  addSeed: (seedData) => {
    const id = generateSeedId();
    const seed: SeedItem = {
      ...seedData,
      id,
      rarity: computeRarity(seedData.phenotype.rarityScore),
      obtainedAt: Date.now(),
    };
    set((state) => ({ seeds: { ...state.seeds, [id]: seed } }));
    return id;
  },

  addSeedBatch: (seedDataArray) => {
    const now = Date.now();
    const newSeeds: Record<string, SeedItem> = {};
    const ids: string[] = [];
    for (const seedData of seedDataArray) {
      const id = generateSeedId();
      ids.push(id);
      newSeeds[id] = {
        ...seedData,
        id,
        rarity: computeRarity(seedData.phenotype.rarityScore),
        obtainedAt: now,
      };
    }
    set((state) => ({ seeds: { ...state.seeds, ...newSeeds } }));
    return ids;
  },

  removeSeed: (seedId, quantity = 1) => {
    set((state) => {
      const seed = state.seeds[seedId];
      if (!seed) return state;
      if (seed.quantity <= quantity) {
        const updated = { ...state.seeds };
        delete updated[seedId];
        return { seeds: updated };
      }
      return {
        seeds: {
          ...state.seeds,
          [seedId]: { ...seed, quantity: seed.quantity - quantity },
        },
      };
    });
  },

  addHarvest: (harvestData) => {
    const id = generateHarvestId();
    const harvest: HarvestItem = { ...harvestData, id, harvestedAt: Date.now() };
    set((state) => ({ harvests: { ...state.harvests, [id]: harvest } }));
    return id;
  },

  removeHarvest: (harvestId) => {
    set((state) => {
      const updated = { ...state.harvests };
      delete updated[harvestId];
      return { harvests: updated };
    });
  },

  addCurrency: (amount) => {
    set((state) => ({ currency: state.currency + amount }));
  },

  spendCurrency: (amount) => {
    const current = get().currency;
    if (current < amount) return false;
    set((state) => ({ currency: state.currency - amount }));
    return true;
  },

  initStartingInventory: () => {
    try {
      // Prova a usare il modulo genetics
      const { generateStarterSeeds } = require('../genetics/hybridiser');
      const starters = generateStarterSeeds();
      if (starters && starters.length) {
        get().addSeedBatch(starters);
        return;
      }
    } catch (error) {
      console.warn('generateStarterSeeds fallito, uso fallback manuale:', error);
    }
    // Fallback manuale: semi base
    const fallbackSeeds: Array<Omit<SeedItem, 'id' | 'obtainedAt'>> = [
      createBaseSeed('tomato_cherry', 5),
      createBaseSeed('chili_cayenne', 3),
      createBaseSeed('basil_sweet', 3),
      createBaseSeed('radish_cherry_belle', 3),
    ];
    get().addSeedBatch(fallbackSeeds);
  },
});

// Helper per il fallback
function createBaseSeed(speciesId: string, quantity: number): Omit<SeedItem, 'id' | 'obtainedAt'> {
  return {
    speciesId,
    genotype: { genes: {} },
    phenotype: {
      rarityScore: 0.2,
      growthRate: 0.5,
      fruitSize: 0.5,
      yieldMultiplier: 1.0,
      fruitCount: 1,
      heightFactor: 0.5,
      waterEfficiency: 0.5,
      primaryColorShift: 0,
    },
    rarity: 'common',
    quantity,
    parentIds: [null, null],
    generation: 0,
    isHybrid: false,
  };
}
