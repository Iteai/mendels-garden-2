// ─────────────────────────────────────────────
// src/genetics/hybridiser.ts
//
// High-level breeding API.
//
// Responsibilities:
//   - Cross two parent genotypes via Mendelian segregation
//   - Apply post-cross mutation
//   - Compute offspring phenotype and rarity
//   - Produce SeedItem records ready for inventory
//   - Generate starter seed sets for new players
// ─────────────────────────────────────────────

import type {
  Genotype,
  GenePair,
  AlleleValue,
  SeedItem,
  SpeciesId,
} from '../types';
import { ALL_GENE_KEYS } from './genes';
import {
  createWildTypeGenotype,
  computePhenotype,
  applyMutation,
} from './genotype';
import { computeRarityLabel } from './rarity';
import type { RarityLabel } from './rarity';

// ─── Local rarity helper — maps score to SeedItem rarity type ──
// This duplicates computeRarity from inventoryStore to break the
// circular dependency: genetics → store → genetics.
function computeRarity(rarityScore: number): 'common' | 'uncommon' | 'rare' | 'legendary' {
  return computeRarityLabel(rarityScore);
}

// ─── Mendelian Segregation ────────────────────

/**
 * Draw one allele from a gene pair — models gamete formation.
 * Each allele in the pair has an equal (50%) chance of being passed.
 */
function segregate(pair: GenePair): AlleleValue {
  return pair[Math.random() < 0.5 ? 0 : 1];
}

/**
 * Cross two parent gene pairs to produce an offspring pair.
 * Each parent contributes exactly one allele.
 */
function crossPairs(parentA: GenePair, parentB: GenePair): GenePair {
  return [segregate(parentA), segregate(parentB)];
}

// ─── Core Cross ───────────────────────────────

export type CrossResult = {
  genotype: Genotype;
  mutationsOccurred: number; // count of alleles that mutated
};

/**
 * Cross two parent genotypes, then apply per-gene mutation.
 *
 * For genes present in both parents, standard Mendelian segregation applies.
 * For genes in only one parent (e.g. different species), that parent's
 * allele is duplicated (creates a homozygous pair).
 * Genes absent in both parents are omitted from offspring.
 *
 * @param genotypeA      Parent A genotype
 * @param genotypeB      Parent B genotype
 * @param mutationRate   Global mutation multiplier (1.0 = normal)
 */
export function crossGenotypes(
  genotypeA: Genotype,
  genotypeB: Genotype,
  mutationRate = 1.0,
): CrossResult {
  const allKeys = new Set([
    ...Object.keys(genotypeA),
    ...Object.keys(genotypeB),
  ]);

  const crossed: Genotype = {};

  for (const key of allKeys) {
    const pairA = genotypeA[key];
    const pairB = genotypeB[key];

    if (pairA && pairB) {
      crossed[key] = crossPairs(pairA, pairB);
    } else if (pairA) {
      // Gene only in parent A — duplicate its allele
      crossed[key] = [segregate(pairA), segregate(pairA)];
    } else if (pairB) {
      crossed[key] = [segregate(pairB), segregate(pairB)];
    }
  }

  // Apply mutation and count changes
  const preMutation = { ...crossed };
  const mutated = applyMutation(crossed, mutationRate);

  let mutationsOccurred = 0;
  for (const key of ALL_GENE_KEYS) {
    const pre = preMutation[key];
    const post = mutated[key];
    if (!pre || !post) continue;
    if (pre[0] !== post[0]) mutationsOccurred++;
    if (pre[1] !== post[1]) mutationsOccurred++;
  }

  return { genotype: mutated, mutationsOccurred };
}

// ─── Seed Generation ─────────────────────────

/**
 * Parameters for breeding two seed parents.
 */
export type BreedParams = {
  parentA: SeedItem;
  parentB: SeedItem;
  /** Number of offspring seeds to generate (default 3) */
  offspringCount?: number;
  /** Mutation rate multiplier (default 1.0) */
  mutationRate?: number;
};

export type BreedResult = {
  seeds: Array<Omit<SeedItem, 'id' | 'obtainedAt'>>;
  mutationEvents: number;
};

/**
 * Breed two seed items and produce offspring seeds.
 *
 * Rules:
 * - Species is inherited from parent A (same-species required for now)
 * - Each offspring is an independent cross (not clones)
 * - Generation = max(parentA.generation, parentB.generation) + 1
 *
 * Cross-species breeding is blocked at the UI layer in Phase 5.
 */
export function breedSeeds(params: BreedParams): BreedResult {
  const {
    parentA,
    parentB,
    offspringCount = 3,
    mutationRate = 1.0,
  } = params;

  const seeds: BreedResult['seeds'] = [];
  let totalMutations = 0;

  for (let i = 0; i < offspringCount; i++) {
    const { genotype, mutationsOccurred } = crossGenotypes(
      parentA.genotype,
      parentB.genotype,
      mutationRate,
    );

    totalMutations += mutationsOccurred;

    const speciesId = parentA.speciesId; // species from parent A
    const phenotype = computePhenotype(genotype, speciesId);

    seeds.push({
      speciesId,
      genotype,
      phenotype,
      rarity: computeRarity(phenotype.rarityScore),
      quantity: 1,
      parentIds: [parentA.id, parentB.id],
      generation: Math.max(parentA.generation, parentB.generation) + 1,
    });
  }

  return { seeds, mutationEvents: totalMutations };
}

// ─── Wild Seed Creation ───────────────────────

/**
 * Create a single wild-type seed for a species.
 * Used for starting inventory and shop stock.
 */
export function createWildSeed(
  speciesId: SpeciesId,
  quantity = 1,
): Omit<SeedItem, 'id' | 'obtainedAt'> {
  const genotype = createWildTypeGenotype(speciesId);
  const phenotype = computePhenotype(genotype, speciesId);

  return {
    speciesId,
    genotype,
    phenotype,
    rarity: computeRarity(phenotype.rarityScore),
    quantity,
    parentIds: [null, null],
    generation: 0,
  };
}

// ─── Starter Seed Pack ────────────────────────

/**
 * Generate the player's starter inventory.
 * 3 tomato seeds with varied genotypes — all gen-0 wild-type.
 * One of the three has a slightly elevated mutation run applied
 * to create a touch of variation from the start.
 */
export function generateStarterSeeds(): Array<Omit<SeedItem, 'id' | 'obtainedAt'>> {
  const seeds: Array<Omit<SeedItem, 'id' | 'obtainedAt'>> = [];

  // Seed 1 — standard wild-type tomato
  seeds.push(createWildSeed('tomato', 2));

  // Seed 2 — another wild-type, different random draw
  seeds.push(createWildSeed('tomato', 2));

  // Seed 3 — slightly mutated variant (0.5× extra mutation pass)
  // This gives the player at least one interesting starting specimen
  const variantGenotype = applyMutation(
    createWildTypeGenotype('tomato'),
    2.5, // higher rate for this one seed only
  );
  const variantPhenotype = computePhenotype(variantGenotype, 'tomato');

  seeds.push({
    speciesId: 'tomato',
    genotype: variantGenotype,
    phenotype: variantPhenotype,
    rarity: computeRarity(variantPhenotype.rarityScore),
    quantity: 1,
    parentIds: [null, null],
    generation: 0,
  });

  return seeds;
}

// ─── Phenotype Preview ────────────────────────

/**
 * Predict the likely phenotype range for offspring of two parents.
 * Runs N simulated crosses and returns min/mean/max per trait.
 * Used by the Lab screen to show a preview before committing.
 */
export type PhenotypePreview = {
  trait: string;
  min: number;
  mean: number;
  max: number;
};

export function previewBreed(
  parentA: SeedItem,
  parentB: SeedItem,
  samples = 20,
): PhenotypePreview[] {
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
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    return {
      trait,
      min:  sorted[0] ?? 0,
      mean: Math.round(mean * 100) / 100,
      max:  sorted[sorted.length - 1] ?? 0,
    };
  });
}
