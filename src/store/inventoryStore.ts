// ─────────────────────────────────────────────
// src/store/inventoryStore.ts
// Inventory state: seeds, harvests, currency, shop
// Phase 5: Harvest + Shop with variety support
// ─────────────────────────────────────────────

import { StateCreator } from 'zustand';
import type {
  InventoryState,
  SeedItem,
  HarvestItem,
  SeedRarity,
  PlantInstance,
} from '../types';
import { GAME } from '../constants/theme';
import { computeRarityLabel } from '../genetics/rarity';
import { getVarietiesForSpecies, generateVarietySeed } from '../genetics/varieties';

// ─── Rarity Computation ───────────────────────

export function computeRarity(rarityScore: number): SeedRarity {
  return computeRarityLabel(rarityScore) as SeedRarity;
}

// ─── ID helpers ───────────────────────────────

function generateSeedId(): string {
  return `seed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateHarvestId(): string {
  return `harvest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Shop Item Types ──────────────────────────

export type ConsumableType = 'water_pack' | 'nutrient_pack';

export type ShopItem = {
  id: string;
  label: string;
  description: string;
  icon: string;
  cost: number;
  type: 'consumable' | 'wild_seed' | 'variety_seed';
  /** For variety seeds, which variety id this maps to */
  varietyId?: string;
};

/** Build the full shop item list dynamically from variety registry */
export function buildShopItems(): ShopItem[] {
  const items: ShopItem[] = [
    // Consumables
    {
      id: 'water_pack',
      label: 'Water Pack',
      description: 'Fills 35% water to all plants',
      icon: 'water-outline',
      cost: 10,
      type: 'consumable',
    },
    {
      id: 'nutrient_pack',
      label: 'Nutrient Pack',
      description: 'Adds 30% nutrients to all plants',
      icon: 'leaf-outline',
      cost: 15,
      type: 'consumable',
    },
  ];

  // Variety seeds for all species
  const speciesIds = ['tomato', 'chili', 'basil', 'radish'] as const;
  const baseCosts: Record<string, number> = {
    tomato: 20, chili: 25, basil: 20, radish: 15,
  };

  for (const speciesId of speciesIds) {
    const varieties = getVarietiesForSpecies(speciesId);
    for (const variety of varieties) {
      const costMultiplier =
        variety.rarityHint === 'legendary' ? 4 :
        variety.rarityHint === 'rare' ? 2.5 :
        variety.rarityHint === 'uncommon' ? 1.5 : 1;
      const cost = Math.round((baseCosts[speciesId] ?? 20) * costMultiplier);

      items.push({
        id: `variety_${variety.id}`,
        label: `${variety.displayName} ${speciesLabel(speciesId)}`,
        description: variety.description,
        icon: varietyIcon(variety.rarityHint),
        cost,
        type: 'variety_seed',
        varietyId: variety.id,
      });
    }
  }

  return items;
}

function speciesLabel(id: string): string {
  const map: Record<string, string> = { tomato: 'Tomato', chili: 'Chili', basil: 'Basil', radish: 'Radish' };
  return map[id] ?? id;
}

function varietyIcon(rarity: string): string {
  const map: Record<string, string> = {
    common: 'leaf', uncommon: 'leaf', rare: 'star-outline', legendary: 'star',
  };
  return map[rarity] ?? 'leaf';
}

export const SHOP_ITEMS: ShopItem[] = buildShopItems();

// ─── Harvest Result ───────────────────────────

export type HarvestResult = {
  harvestId: string;
  seedIds: string[];
  currencyEarned: number;
  totalSeedsExtracted: number;
};

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

  // ── Phase 5: Game Loop Actions ──────────────
  harvestPlant: (plant: PlantInstance) => HarvestResult;
  buyWildSeed: (speciesId: string) => string | null;
  buyVarietySeed: (varietyId: string) => string | null;
  canAfford: (cost: number) => boolean;
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

  canAfford: (cost) => get().currency >= cost,

  initStartingInventory: () => {
    const { generateStarterSeeds } = require('../genetics/hybridiser');
    const starters: Array<Omit<SeedItem, 'id' | 'obtainedAt'>> = generateStarterSeeds();
    get().addSeedBatch(starters);
  },

  // ── Harvest Plant ─────────────────────────

  harvestPlant: (plant) => {
    const ph = plant.phenotype;
    const qty = Math.max(1, Math.round(ph.yieldMultiplier * 3));
    const harvestId = get().addHarvest({
      speciesId: plant.speciesId,
      plantId:   plant.id,
      quantity:  qty,
      quality:   plant.healthValue,
    });

    const baseSeeds = Math.random() < ph.seedViability ? 2 : 1;
    const bonusSeed = Math.random() < (ph.seedViability - 0.5) * 2 ? 1 : 0;
    const totalSeeds = Math.max(1, baseSeeds + bonusSeed);

    const seedIds: string[] = [];
    for (let i = 0; i < totalSeeds; i++) {
      const sid = get().addSeed({
        speciesId:  plant.speciesId,
        genotype:   plant.genotype,
        phenotype:  plant.phenotype,
        rarity:     computeRarity(ph.rarityScore),
        quantity:   1,
        parentIds:  plant.parentIds,
        generation: plant.generation,
      });
      seedIds.push(sid);
    }

    const baseCurrency = qty * 3;
    const qualityBonus = Math.round(plant.healthValue * 5);
    const currencyEarned = baseCurrency + qualityBonus;
    get().addCurrency(currencyEarned);

    return { harvestId, seedIds, currencyEarned, totalSeedsExtracted: totalSeeds };
  },

  // ── Shop ─────────────────────────────────

  buyWildSeed: (speciesId) => {
    const speciesCost = SHOP_ITEMS.find(
      (item) => item.id === `wild_seed_${speciesId}`,
    )?.cost ?? 20;

    if (!get().spendCurrency(speciesCost)) return null;

    const { createWildSeed } = require('../genetics/hybridiser');
    const wildSeed = createWildSeed(speciesId, 1);
    const id = get().addSeed(wildSeed);
    return id;
  },

  buyVarietySeed: (varietyId) => {
    const shopItem = SHOP_ITEMS.find((item) => item.varietyId === varietyId);
    if (!shopItem || !get().spendCurrency(shopItem.cost)) return null;

    const result = generateVarietySeed(varietyId);
    if (!result) return null;

    const id = get().addSeed({
      speciesId:  getVarietyOrThrow(varietyId).speciesId,
      genotype:   result.genotype,
      phenotype:  result.phenotype,
      rarity:     computeRarity(result.phenotype.rarityScore),
      quantity:   1,
      parentIds:  [null, null],
      generation: 0,
    });
    return id;
  },
});

// ─── Helper ────────────────────────────────────

function getVarietyOrThrow(varietyId: string): { speciesId: string } {
  const { getVariety } = require('../genetics/varieties');
  const v = getVariety(varietyId);
  if (!v) throw new Error(`Unknown variety: ${varietyId}`);
  return v;
}