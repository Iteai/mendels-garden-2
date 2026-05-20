// ─────────────────────────────────────────────
// src/store/inventoryStore.ts
// Inventory state: seeds, harvests, currency
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
  /** Add a batch of seeds in one store write — avoids N individual writes */
  addSeedBatch: (seeds: Array<Omit<SeedItem, 'id' | 'obtainedAt'>>) => string[];
  /** Populate the starting inventory on first launch */
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

  // ── Single seed add ───────────────────────

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

  // ── Batch seed add (single write) ─────────

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

  // ── Remove seed ───────────────────────────

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

  // ── Harvests ──────────────────────────────

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

  // ── Currency ──────────────────────────────

  addCurrency: (amount) => {
    set((state) => ({ currency: state.currency + amount }));
  },

  spendCurrency: (amount) => {
    const current = get().currency;
    if (current < amount) return false;
    set((state) => ({ currency: state.currency - amount }));
    return true;
  },

  // ── First-launch inventory ─────────────────
  // Called once on first app open.
  // Uses a lazy import to avoid circular dependency with the genetics module.

  initStartingInventory: () => {
    // Lazy import avoids circular dep at module eval time
    const { generateStarterSeeds } = require('../genetics/hybridiser');
    const starters: Array<Omit<SeedItem, 'id' | 'obtainedAt'>> = generateStarterSeeds();
    get().addSeedBatch(starters);
  },
});
