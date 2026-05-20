// ─────────────────────────────────────────────
// src/game/gameLoop.ts
//
// Pure game loop calculations.
// No store access, no side-effects.
//
// Covers:
//   - Harvest yield (quantity + quality)
//   - Seed extraction probability
//   - Currency reward calculation
//   - Planting pre-conditions
//   - Breed cost validation
// ─────────────────────────────────────────────

import type { PlantInstance, SeedItem, GardenPlot, SeedRarity, SpeciesDefinition } from '../types';

// ─── Constants ─────────────────────────────────

/** Maximum number of living plants allowed in the garden */
export const MAX_PLANTS = 300;

// ─── Harvest ──────────────────────────────────

export type YieldResult = {
  quantity:        number;  // number of harvest items produced
  quality:         number;  // 0–1, affects currency and downstream value
  seedsExtracted:  number;  // seeds that can be recovered
  currencyReward:  number;  // spores earned
};

/**
 * Calculate full harvest result from a mature/ready plant.
 *
 * Quantity formula:
 *   base = round(2 + fruitCount × 4)        → 2–6 fruits
 *   scaled = base × yieldMultiplier          → 0–12 (usually 1–8)
 *   final  = max(1, round(scaled × health))  → health penalty at harvest
 *
 * Quality = healthValue at moment of harvest.
 *
 * Seeds extracted: probabilistic roll of up to 3, each at seedViability.
 * Always returns at least 1 seed (the plant was alive).
 *
 * Currency = quantity × quality × (1 + rarityScore × 3) × SPORES_PER_FRUIT
 */
export function calculateHarvest(
  plant:   PlantInstance,
  _species: SpeciesDefinition, // reserved for species-specific modifiers
): YieldResult {
  const ph = plant.phenotype;

  // Yield quantity
  const baseQty    = 2 + ph.fruitCount * 4;                  // 2–6
  const scaledQty  = baseQty * ph.yieldMultiplier;            // 0–12
  const quantity   = Math.max(1, Math.round(scaledQty * plant.healthValue));

  // Quality = current health
  const quality = Math.max(0.10, plant.healthValue);

  // Seeds: up to 3 rolls, each succeeds at seedViability probability
  let seedsExtracted = 0;
  for (let i = 0; i < 3; i++) {
    if (Math.random() < ph.seedViability) seedsExtracted++;
  }
  seedsExtracted = Math.max(1, seedsExtracted); // guaranteed minimum 1

  // Currency reward
  const rarityBonus   = 1 + ph.rarityScore * 3.5;  // 1× common → 4.5× legendary
  const qualityBonus  = 0.4 + quality * 0.6;        // 0.4× poor → 1.0× perfect
  const currencyReward = Math.round(
    quantity * rarityBonus * qualityBonus * SPORES_PER_FRUIT,
  );

  return { quantity, quality, seedsExtracted, currencyReward };
}

/** Base spores earned per fruit unit at quality 1.0, rarity 0 */
const SPORES_PER_FRUIT = 6;

// ─── Compost ──────────────────────────────────

/**
 * Reward for composting a dead or decaying plant.
 * Smaller than a full harvest — it's a consolation payout.
 */
export function calculateCompostReward(plant: PlantInstance): number {
  const rarityBonus = 1 + plant.phenotype.rarityScore * 1.5;
  return Math.max(1, Math.round(rarityBonus * 3));
}

// ─── Planting validation ──────────────────────

export type PlantingError =
  | 'plot_not_found'
  | 'plot_occupied'
  | 'plot_locked'
  | 'seed_not_found'
  | 'seed_depleted'
  | 'garden_full';

export type PlantingValidation =
  | { ok: true }
  | { ok: false; error: PlantingError };

export function validatePlanting(
  seed:  SeedItem | null | undefined,
  plot:  GardenPlot | null | undefined,
): PlantingValidation {
  if (!plot)                       return { ok: false, error: 'plot_not_found' };
  if (plot.state === 'locked')     return { ok: false, error: 'plot_locked' };
  if (plot.state === 'occupied')   return { ok: false, error: 'plot_occupied' };
  if (!seed)                       return { ok: false, error: 'seed_not_found' };
  if (seed.quantity <= 0)          return { ok: false, error: 'seed_depleted' };
  return { ok: true };
}

/**
 * Check if the garden has reached maximum plant capacity.
 * Must be called from gameActions with store access (circular-safe).
 */
export function isGardenFull(state: { plants: Record<string, PlantInstance> }): boolean {
  const livingCount = Object.values(state.plants).filter(
    (p) => p.growthStage !== 'dead',
  ).length;
  return livingCount >= MAX_PLANTS;
}

export function plantingErrorMessage(error: PlantingError): string {
  const messages: Record<PlantingError, string> = {
    plot_not_found: 'Plot not found.',
    plot_occupied:  'This plot already has a plant.',
    plot_locked:    'This plot is locked.',
    seed_not_found: 'Seed not found in inventory.',
    seed_depleted:  'No seeds of this type remaining.',
    garden_full:    `Your garden is full (max ${MAX_PLANTS} plants). Compost dead plants first.`,
  };
  return messages[error];
}

// ─── Breeding cost ────────────────────────────

/** Spore cost to breed two seeds in the Lab */
export const BREED_COST = 0;

export type BreedValidation =
  | { ok: true }
  | { ok: false; reason: 'insufficient_currency' | 'incompatible_species' | 'missing_parent' };

export function validateBreed(
  parentA:  SeedItem | null | undefined,
  parentB:  SeedItem | null | undefined,
  currency: number,
): BreedValidation {
  if (!parentA || !parentB)
    return { ok: false, reason: 'missing_parent' };
  if (parentA.speciesId !== parentB.speciesId)
    return { ok: false, reason: 'incompatible_species' };
  if (currency < BREED_COST)
    return { ok: false, reason: 'insufficient_currency' };
  return { ok: true };
}

export function breedValidationMessage(reason: BreedValidation extends { ok: false } ? BreedValidation['reason'] : never): string {
  const messages = {
    insufficient_currency: `Not enough spores. Breeding costs ${BREED_COST} ✦`,
    incompatible_species:  'Both parents must be the same species.',
    missing_parent:        'Select two parent seeds to breed.',
  };
  return messages[reason];
}

// ─── Harvest readiness ────────────────────────

export function canHarvest(plant: PlantInstance): boolean {
  return plant.growthStage === 'harvest_ready' || plant.growthStage === 'mature';
}

export function canCompost(plant: PlantInstance): boolean {
  return plant.growthStage === 'dead' || plant.growthStage === 'decaying';
}

export function shouldWater(plant: PlantInstance): boolean {
  return plant.waterLevel < 0.35;
}

export function shouldFeed(plant: PlantInstance): boolean {
  return plant.nutrientLevel < 0.30;
}

// ─── Rarity label helpers ─────────────────────

export function rarityFromScore(score: number): SeedRarity {
  if (score >= 0.85) return 'legendary';
  if (score >= 0.60) return 'rare';
  if (score >= 0.30) return 'uncommon';
  return 'common';
}

export const RARITY_SPORE_MULTIPLIER: Record<SeedRarity, number> = {
  common:    1.0,
  uncommon:  1.8,
  rare:      3.5,
  legendary: 7.0,
};