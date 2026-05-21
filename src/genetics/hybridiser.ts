// ─────────────────────────────────────────────
// src/genetics/hybridiser.ts
// Breeding API — same-family and cross-family.
//
// Cross-family hybrids:
//   - Offspring speciesId chosen 50/50 from either parent
//   - isHybrid = true with both family IDs recorded
//   - Rarity bonus +0.18 (hybrid vigour effect)
//   - All 10 gene keys are shared across families,
//     so the cross works mechanically without changes
//     to the genetics engine
// ─────────────────────────────────────────────

import type { Genotype, GenePair, AlleleValue, SeedItem, SpeciesId } from '../types';
import { ALL_GENE_KEYS } from './genes';
import { createWildTypeGenotype, computePhenotype, applyMutation } from './genotype';
import { getSpecies, getSpeciesFamily } from './species';
import { computeRarity } from '../store/inventoryStore';

// ─── Segregation ──────────────────────────────

function segregate(pair: GenePair): AlleleValue {
  return pair[Math.random() < 0.5 ? 0 : 1];
}

function crossPairs(a: GenePair, b: GenePair): GenePair {
  return [segregate(a), segregate(b)];
}

// ─── Core cross ───────────────────────────────

export type CrossResult = {
  genotype:          Genotype;
  mutationsOccurred: number;
};

export function crossGenotypes(
  genotypeA:    Genotype,
  genotypeB:    Genotype,
  mutationRate  = 1.0,
): CrossResult {
  const allKeys = new Set([...Object.keys(genotypeA), ...Object.keys(genotypeB)]);
  const crossed: Genotype = {};

  for (const key of allKeys) {
    const pA = genotypeA[key];
    const pB = genotypeB[key];
    if (pA && pB)       crossed[key] = crossPairs(pA, pB);
    else if (pA)        crossed[key] = [segregate(pA), segregate(pA)];
    else if (pB)        crossed[key] = [segregate(pB), segregate(pB)];
  }

  const preMutation = { ...crossed };
  const mutated     = applyMutation(crossed, mutationRate);

  let mutationsOccurred = 0;
  for (const key of ALL_GENE_KEYS) {
    const pre = preMutation[key]; const post = mutated[key];
    if (!pre || !post) continue;
    if (pre[0] !== post[0]) mutationsOccurred++;
    if (pre[1] !== post[1]) mutationsOccurred++;
  }

  return { genotype: mutated, mutationsOccurred };
}

// ─── Seed generation ──────────────────────────

export type BreedParams = {
  parentA:        SeedItem;
  parentB:        SeedItem;
  offspringCount?: number;
  mutationRate?:   number;
};

export type BreedResult = {
  seeds:          Array<Omit<SeedItem, 'id' | 'obtainedAt'>>;
  mutationEvents: number;
};

export function breedSeeds(params: BreedParams): BreedResult {
  const { parentA, parentB, offspringCount = 3, mutationRate = 1.0 } = params;

  const familyA      = getSpeciesFamily(parentA.speciesId);
  const familyB      = getSpeciesFamily(parentB.speciesId);
  const isCrossFamily = familyA !== familyB;

  const seeds: BreedResult['seeds'] = [];
  let totalMutations = 0;

  for (let i = 0; i < offspringCount; i++) {
    const { genotype, mutationsOccurred } = crossGenotypes(
      parentA.genotype, parentB.genotype, mutationRate,
    );
    totalMutations += mutationsOccurred;

    // Cross-family: offspring randomly inherits one parent's species
    const speciesId: SpeciesId = isCrossFamily
      ? (Math.random() < 0.5 ? parentA.speciesId : parentB.speciesId)
      : parentA.speciesId;

    const phenotype = computePhenotype(genotype, speciesId);

    // Hybrid rarity bonus — heterosis effect
    const adjustedRarityScore = isCrossFamily
      ? Math.min(1, phenotype.rarityScore + 0.18)
      : phenotype.rarityScore;

    const adjustedPhenotype = { ...phenotype, rarityScore: adjustedRarityScore };

    seeds.push({
      speciesId,
      genotype,
      phenotype:      adjustedPhenotype,
      rarity:         computeRarity(adjustedRarityScore),
      quantity:       1,
      parentIds:      [parentA.id, parentB.id],
      generation:     Math.max(parentA.generation, parentB.generation) + 1,
      isHybrid:       isCrossFamily || parentA.isHybrid || parentB.isHybrid,
      hybridFamilyA:  isCrossFamily ? familyA : undefined,
      hybridFamilyB:  isCrossFamily ? familyB : undefined,
    });
  }

  return { seeds, mutationEvents: totalMutations };
}

// ─── Wild seed ────────────────────────────────

export function createWildSeed(
  speciesId: SpeciesId,
  quantity   = 1,
): Omit<SeedItem, 'id' | 'obtainedAt'> {
  const genotype  = createWildTypeGenotype(speciesId);
  const phenotype = computePhenotype(genotype, speciesId);
  return {
    speciesId, genotype, phenotype,
    rarity:     computeRarity(phenotype.rarityScore),
    quantity,
    parentIds:  [null, null],
    generation: 0,
  };
}

// ─── Starter pack ─────────────────────────────
// One seed per family to introduce all four visual designs

export function generateStarterSeeds(): Array<Omit<SeedItem, 'id' | 'obtainedAt'>> {
  return [
    createWildSeed('tomato_cherry',  2),
    createWildSeed('chili_cayenne',  2),
    createWildSeed('basil_sweet',    2),
    createWildSeed('radish_cherry',  2),
  ];
}

// ─── Breed preview ────────────────────────────

export type PhenotypePreview = { trait: string; min: number; mean: number; max: number };

export function previewBreed(
  parentA: SeedItem,
  parentB: SeedItem,
  samples  = 20,
): PhenotypePreview[] {
  // For cross-family preview use parentA species for phenotype evaluation
  const speciesId = parentA.speciesId;
  const traitSamples: Record<string, number[]> = {};

  for (let i = 0; i < samples; i++) {
    const { genotype } = crossGenotypes(parentA.genotype, parentB.genotype);
    const ph = computePhenotype(genotype, speciesId);
    for (const [key, val] of Object.entries(ph)) {
      if (key === 'rarityScore') continue;
      if (!traitSamples[key]) traitSamples[key] = [];
      traitSamples[key].push(val as number);
    }
  }

  return Object.entries(traitSamples).map(([trait, values]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mean   = values.reduce((s, v) => s + v, 0) / values.length;
    return { trait, min: sorted[0] ?? 0, mean: Math.round(mean * 100) / 100, max: sorted[sorted.length - 1] ?? 0 };
  });
}
