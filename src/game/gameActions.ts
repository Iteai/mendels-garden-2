// ─────────────────────────────────────────────
// src/game/gameActions.ts
//
// Compound Zustand actions — each wraps multiple
// store operations into a single atomic transaction.
//
// These are the primary game-loop actions the UI calls.
// All validation lives in gameLoop.ts (pure).
// All state mutation lives in store slices.
// ─────────────────────────────────────────────

import { useAppStore } from '../store';
import { getSpecies } from '../genetics/species';
import {
  calculateHarvest,
  calculateCompostReward,
  validatePlanting,
  validateBreed,
  rarityFromScore,
  canHarvest,
  canCompost,
  BREED_COST,
  type YieldResult,
  type PlantingValidation,
  type BreedValidation,
} from './gameLoop';
import { breedSeeds } from '../genetics/hybridiser';
import type { PlantInstance, SeedItem } from '../types';

// ─── Planting ─────────────────────────────────

export type PlantResult =
  | { ok: true;  plant: PlantInstance }
  | { ok: false; error: string };

/**
 * Plant a seed from inventory into a garden plot.
 * Atomically: validates → creates plant → decrements seed quantity.
 */
export function plantFromInventory(seedId: string, plotId: string): PlantResult {
  const state = useAppStore.getState();
  const seed  = state.seeds[seedId];
  const plot  = state.plots[plotId];

  const validation = validatePlanting(seed, plot);
  if (!validation.ok) return { ok: false, error: validation.error };

  // Place the plant
  const plant = state.plantSeed({
    plotId,
    speciesId:  seed.speciesId,
    varietyId:  seed.varietyId,
    genotype:   seed.genotype,
    phenotype:  seed.phenotype,
    parentIds:  seed.parentIds,
    generation: seed.generation,
  });

  if (!plant) return { ok: false, error: 'plot_occupied' };

  // Consume one seed
  state.removeSeed(seedId, 1);

  return { ok: true, plant };
}

// ─── Harvesting ───────────────────────────────

export type HarvestSummary = {
  plantId:         string;
  speciesId:       string;
  yield:           YieldResult;
  seedsObtained:   number;
  currencyEarned:  number;
};

/**
 * Harvest a ready plant.
 * Atomically: calculates yield → adds harvest record → extracts seeds
 *             → awards currency → removes plant from plot.
 */
export function harvestPlant(plantId: string): HarvestSummary | null {
  const state = useAppStore.getState();
  const plant = state.plants[plantId];

  if (!plant || !canHarvest(plant)) return null;

  let species;
  try { species = getSpecies(plant.speciesId); }
  catch { return null; }

  const yieldResult = calculateHarvest(plant, species);

  // Add harvest record
  state.addHarvest({
    speciesId: plant.speciesId,
    plantId,
    quantity:  yieldResult.quantity,
    quality:   yieldResult.quality,
  });

  // Extract seeds (seedsExtracted is already randomised in calculateHarvest)
  const seedRarity = rarityFromScore(plant.phenotype.rarityScore);
  state.addSeed({
    speciesId:  plant.speciesId,
    varietyId:  plant.varietyId,
    genotype:   plant.genotype,
    phenotype:  plant.phenotype,
    rarity:     seedRarity,
    quantity:   yieldResult.seedsExtracted,
    parentIds:  plant.parentIds,
    generation: plant.generation,
  });

  // Award currency
  state.addCurrency(yieldResult.currencyReward);

  // Remove plant and free the plot
  state.removePlant(plantId);

  return {
    plantId,
    speciesId:      plant.speciesId,
    yield:          yieldResult,
    seedsObtained:  yieldResult.seedsExtracted,
    currencyEarned: yieldResult.currencyReward,
  };
}

// ─── Composting ───────────────────────────────

export type CompostResult = { currencyEarned: number };

/**
 * Compost a dead or decaying plant.
 * Smaller reward than a full harvest — consolation payout.
 */
export function compostPlant(plantId: string): CompostResult | null {
  const state = useAppStore.getState();
  const plant = state.plants[plantId];

  if (!plant || !canCompost(plant)) return null;

  const reward = calculateCompostReward(plant);
  state.addCurrency(reward);
  state.removePlant(plantId);

  return { currencyEarned: reward };
}

// ─── Breeding ─────────────────────────────────

export type BreedResult =
  | { ok: true;  seedIds: string[]; mutationEvents: number }
  | { ok: false; reason: string };

/**
 * Breed two seeds from inventory.
 * Atomically: validates → spends currency → produces offspring
 *             → adds to inventory → optionally consumes one of each parent.
 *
 * Parent seeds are NOT consumed in Phase 5 (player keeps them).
 * Phase 6 can add a "consume parent" variant for harder progression.
 */
export function breedFromInventory(
  parentAId: string,
  parentBId: string,
): BreedResult {
  const state    = useAppStore.getState();
  const parentA  = state.seeds[parentAId];
  const parentB  = state.seeds[parentBId];

  const validation = validateBreed(parentA, parentB, state.currency);
  if (!validation.ok) return { ok: false, reason: validation.reason };

  // Spend spores
  const spent = state.spendCurrency(BREED_COST);
  if (!spent) return { ok: false, reason: 'insufficient_currency' };

  // Run the cross
  const result = breedSeeds({
    parentA,
    parentB,
    offspringCount: 3,
    mutationRate:   1.0,
  });

  // Add offspring to inventory
  const seedIds = state.addSeedBatch(result.seeds);

  return {
    ok:             true,
    seedIds,
    mutationEvents: result.mutationEvents,
  };
}

// ─── React hooks ──────────────────────────────
// Stable function references — these don't subscribe to state,
// they just call the above functions which read state internally.

import { useCallback } from 'react';

export function useGameActions() {
  const plant   = useCallback(plantFromInventory,  []);
  const harvest = useCallback(harvestPlant,        []);
  const compost = useCallback(compostPlant,        []);
  const breed   = useCallback(breedFromInventory,  []);

  return { plantFromInventory: plant, harvestPlant: harvest, compostPlant: compost, breedFromInventory: breed };
}
