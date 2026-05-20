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
//   - Cross-species breeding (Cayenne × Daikon = hybrid!)
// ─────────────────────────────────────────────

import type {
  Genotype,
  GenePair,
  AlleleValue,
  SeedItem,
  SpeciesId,
  VarietyId,
} from '../types';
import { ALL_GENE_KEYS } from './genes';
import {
  createWildTypeGenotype,
  computePhenotype,
  computeHybridPhenotype,
  applyMutation,
} from './genotype';
import { computeRarity } from '../store/inventoryStore';
import { getDefaultVariety, getVariety, VARIETY_REGISTRY } from './varieties';

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
 * For genes in only one parent, that parent's allele is duplicated.
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

// ─── Cross-species: Determine offspring species ─

/**
 * When crossing two different species, determine the offspring species.
 * Uses a weighted random based on VIGOR expression (whichever parent has
 * more dominant VIGOR alleles is more likely to dominate the hybrid).
 * If both are equal, 50/50.
 */
function determineHybridSpecies(
  genotypeA: Genotype,
  genotypeB: Genotype,
  speciesIdA: SpeciesId,
  speciesIdB: SpeciesId,
): SpeciesId {
  // Count dominant VIGOR alleles for each parent
  const vigorA = genotypeA['VIGOR']?.filter((a) => a === 'D').length ?? 1;
  const vigorB = genotypeB['VIGOR']?.filter((a) => a === 'D').length ?? 1;
  const total = vigorA + vigorB;

  // Weighted probability
  const roll = Math.random();
  if (roll < vigorA / total) return speciesIdA;
  return speciesIdB;
}

/**
 * Determine the variety for a hybrid offspring.
 * Combines variety names from both parents.
 */
function determineHybridVariety(
  varietyIdA: VarietyId,
  varietyIdB: VarietyId,
  offspringSpecies: SpeciesId,
): VarietyId {
  // For same-species breeding: use parent A's variety
  const variA = VARIETY_REGISTRY[varietyIdA];
  const variB = VARIETY_REGISTRY[varietyIdB];
  if (!variA || !variB) return getDefaultVariety(offspringSpecies);

  // If the offspring species matches parent A, use A's variety
  if (variA.speciesId === offspringSpecies) return varietyIdA;
  // If matches parent B, use B's variety
  if (variB.speciesId === offspringSpecies) return varietyIdB;

  // Cross-species hybrid: use a blend label
  // Use the default variety of the offspring species
  return getDefaultVariety(offspringSpecies);
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
 * - Same-species breeding: species and variety from parent A
 * - Cross-species breeding: offspring species determined by VIGOR dominance,
 *   phenotype is a blend of both parent species basePhenotypes
 * - Each offspring is an independent cross (not clones)
 * - Generation = max(parentA.generation, parentB.generation) + 1
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

  const isCrossSpecies = parentA.speciesId !== parentB.speciesId;

  for (let i = 0; i < offspringCount; i++) {
    const { genotype, mutationsOccurred } = crossGenotypes(
      parentA.genotype,
      parentB.genotype,
      mutationRate,
    );

    totalMutations += mutationsOccurred;

    // Determine offspring species and variety
    let speciesId: SpeciesId;
    let varietyId: VarietyId;

    if (isCrossSpecies) {
      // Cross-species: blend!
      speciesId = determineHybridSpecies(
        parentA.genotype, parentB.genotype,
        parentA.speciesId, parentB.speciesId,
      );
      varietyId = determineHybridVariety(
        parentA.varietyId, parentB.varietyId,
        speciesId,
      );
    } else {
      speciesId = parentA.speciesId;
      varietyId = parentA.varietyId;
    }

    // Compute phenotype
    const phenotype = isCrossSpecies
      ? computeHybridPhenotype(genotype, parentA.speciesId, parentB.speciesId)
      : computePhenotype(genotype, speciesId, varietyId);

    // Cross-species hybrids get a bonus to rarity (unusual = valuable)
    const hybridRarityBoost = isCrossSpecies ? 0.1 : 0;

    seeds.push({
      speciesId,
      varietyId,
      genotype,
      phenotype: {
        ...phenotype,
        rarityScore: Math.min(1, phenotype.rarityScore + hybridRarityBoost),
      },
      rarity: computeRarity(phenotype.rarityScore + hybridRarityBoost),
      quantity: 1,
      parentIds: [parentA.id, parentB.id],
      generation: Math.max(parentA.generation, parentB.generation) + 1,
    });
  }

  return { seeds, mutationEvents: totalMutations };
}

// ─── Wild Seed Creation ───────────────────────

/**
 * Create a single wild-type seed for a species/variety.
 * Used for starting inventory and shop stock.
 */
export function createWildSeed(
  speciesId: SpeciesId,
  quantity = 1,
  varietyId?: VarietyId,
): Omit<SeedItem, 'id' | 'obtainedAt'> {
  const vid = varietyId ?? getDefaultVariety(speciesId);
  const genotype = createWildTypeGenotype(speciesId, vid);
  const phenotype = computePhenotype(genotype, speciesId, vid);

  return {
    speciesId,
    varietyId: vid,
    genotype,
    phenotype,
    rarity: computeRarity(phenotype.rarityScore),
    quantity,
    parentIds: [null, null],
    generation: 0,
  };
}

// ─── Starter Seed Pack ────────────────────────
// Gives the player a diverse starting selection:
//   1x Cherry tomato, 1x Beefsteak tomato, 1x Genovese basil,
//   1x Cherry Belle radish, 1x Cayenne chili
// Plus a mutated variant of the first tomato.

export function generateStarterSeeds(): Array<Omit<SeedItem, 'id' | 'obtainedAt'>> {
  const seeds: Array<Omit<SeedItem, 'id' | 'obtainedAt'>> = [];

  // Seed 1 — Cherry tomato (prolific, easy starter)
  seeds.push(createWildSeed('tomato', 2, 'tomato_cherry'));

  // Seed 2 — Beefsteak tomato (large fruit, different experience)
  seeds.push(createWildSeed('tomato', 2, 'tomato_beefsteak'));

  // Seed 3 — Genovese basil (fast-growing aromatic)
  seeds.push(createWildSeed('basil', 1, 'basil_genovese'));

  // Seed 4 — Cayenne chili (heat-lover's starter)
  seeds.push(createWildSeed('chili', 1, 'chili_cayenne'));

  // Seed 5 — Cherry Belle radish (fast-cycling, quick rewards)
  seeds.push(createWildSeed('radish', 1, 'radish_cherry_belle'));

  // Seed 6 — slightly mutated variant of Cherry tomato
  // This gives the player at least one interesting starting specimen
  const variantGenotype = applyMutation(
    createWildTypeGenotype('tomato', 'tomato_cherry'),
    2.5, // higher rate for this one seed only
  );
  const variantPhenotype = computePhenotype(variantGenotype, 'tomato', 'tomato_cherry');
  seeds.push({
    speciesId: 'tomato',
    varietyId: 'tomato_cherry',
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
  const isCrossSpecies = parentA.speciesId !== parentB.speciesId;

  const traitSamples: Record<string, number[]> = {};

  for (let i = 0; i < samples; i++) {
    const { genotype } = crossGenotypes(parentA.genotype, parentB.genotype);

    const ph = isCrossSpecies
      ? computeHybridPhenotype(genotype, parentA.speciesId, parentB.speciesId)
      : computePhenotype(genotype, parentA.speciesId, parentA.varietyId);

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