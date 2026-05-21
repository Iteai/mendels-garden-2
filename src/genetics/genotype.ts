// ─────────────────────────────────────────────
// src/genetics/genotype.ts
//
// Core genetics engine:
//   - Genotype creation (random wild-type for a species)
//   - Allele expression resolution (DD / DR / RR)
//   - Phenotype computation from genotype
//   - Rarity score calculation
//   - Mutation of individual alleles
//
// This module is pure: no side-effects, no store access.
// Same inputs always produce same outputs (deterministic
// if you provide your own RNG seed — seeded RNG in Phase 9).
// ─────────────────────────────────────────────

import type { Genotype, GenePair, AlleleValue, Phenotype, SpeciesId } from '../types';
import {
  GENE_POOL,
  GENE_REGISTRY,
  ALL_GENE_KEYS,
  GENE_COUNT,
  getTraitRange,
  type PhenotypeEffects,
  type GeneDelta,
} from './genes';
import { getSpecies } from './species';

// ─── Allele Resolution ────────────────────────

export type AlleleExpression = 'DD' | 'DR' | 'RR';

export function resolveExpression(pair: GenePair): AlleleExpression {
  const [a, b] = pair;
  if (a === 'D' && b === 'D') return 'DD';
  if (a === 'R' && b === 'R') return 'RR';
  return 'DR'; // DR or RD — same effect
}

/**
 * Multiplier applied to the dominant delta based on expression.
 *   DD → 1.0 (full dominant)
 *   DR → 0.65 (partial — incomplete dominance)
 *   RR → 0   (recessive fully suppresses dominant)
 */
export function dominantMultiplier(expr: AlleleExpression): number {
  switch (expr) {
    case 'DD': return 1.00;
    case 'DR': return 0.65;
    case 'RR': return 0.00;
  }
}

/** Recessive delta only expressed when RR */
export function recessiveMultiplier(expr: AlleleExpression): number {
  return expr === 'RR' ? 1.0 : 0.0;
}

// ─── Genotype Creation ────────────────────────

/**
 * Draw a single allele based on a probability threshold.
 * @param dProbability  0–1 probability that the allele is 'D'
 */
function drawAllele(dProbability: number): AlleleValue {
  return Math.random() < dProbability ? 'D' : 'R';
}

/**
 * Create a random genotype for a species, sampling alleles from
 * that species' allele frequency distribution.
 * Represents a wild-type or typical cultivar of the species.
 */
export function createWildTypeGenotype(speciesId: SpeciesId): Genotype {
  const species = getSpecies(speciesId);
  const freqs = species.alleleFrequencies;
  const genotype: Genotype = {};

  for (const key of species.geneKeys) {
    const dFreq = freqs[key] ?? 0.5;
    genotype[key] = [drawAllele(dFreq), drawAllele(dFreq)];
  }

  return genotype;
}

/**
 * Create a genotype with all dominant alleles (DD for every gene).
 * Used for testing or special "perfect" seeds.
 */
export function createDominantGenotype(speciesId: SpeciesId): Genotype {
  const species = getSpecies(speciesId);
  const genotype: Genotype = {};
  for (const key of species.geneKeys) {
    genotype[key] = ['D', 'D'];
  }
  return genotype;
}

// ─── Phenotype Computation ────────────────────

/**
 * Apply a gene delta (scaled by a multiplier) to a running total.
 * Mutates the accumulator in place for performance.
 */
function applyDelta(
  acc: Record<string, number>,
  delta: GeneDelta,
  multiplier: number,
): void {
  if (multiplier === 0) return;
  for (const [trait, value] of Object.entries(delta)) {
    if (value === undefined) continue;
    acc[trait] = (acc[trait] ?? 0) + value * multiplier;
  }
}

// Pre-compute trait ranges once at module level for fast clamping
const TRAIT_RANGES = new Map<string, [number, number]>();
(function buildTraitRanges() {
  const traits = [
    'heightFactor', 'stemThickness', 'leafSize', 'leafCount',
    'branchDensity', 'flowerSize', 'fruitSize', 'fruitCount',
    'primaryColorShift', 'secondaryColorShift', 'saturationBoost',
    'growthRate', 'waterEfficiency', 'lightEfficiency', 'hardiness',
    'yieldMultiplier', 'seedViability',
  ] as const;
  for (const t of traits) {
    TRAIT_RANGES.set(t, getTraitRange(t as unknown as keyof PhenotypeEffects));
  }
})();

/**
 * Clamp a value to the valid range for a phenotype trait.
 * Uses pre-computed Map for O(1) range lookup.
 */
function clampTrait(trait: string, value: number): number {
  const range = TRAIT_RANGES.get(trait);
  if (!range) return value;
  return Math.max(range[0], Math.min(range[1], value));
}

// Phenotype field keys in order — used for compact construction
const PHENOTYPE_FIELDS: (keyof Phenotype)[] = [
  'heightFactor', 'stemThickness', 'leafSize', 'leafCount',
  'branchDensity', 'flowerSize', 'fruitSize', 'fruitCount',
  'primaryColorShift', 'secondaryColorShift', 'saturationBoost',
  'growthRate', 'waterEfficiency', 'lightEfficiency', 'hardiness',
  'yieldMultiplier', 'seedViability',
];

/**
 * Compute the full Phenotype from a Genotype and species baseline.
 *
 * Algorithm:
 *  1. Start with the species base phenotype values
 *  2. For each gene in the genotype:
 *     a. Resolve DD/DR/RR expression
 *     b. Add dominant delta × dominantMultiplier
 *     c. Add recessive delta × recessiveMultiplier
 *  3. Clamp all traits to valid ranges
 *  4. Compute rarityScore from rare gene expressions
 */
export function computePhenotype(
  genotype: Genotype,
  speciesId: SpeciesId,
): Phenotype {
  const species = getSpecies(speciesId);
  const base = species.basePhenotype;

  // Build mutable accumulator from base (shallow copy)
  const acc = { ...base } as Record<string, number>;

  let rareCount = 0;

  for (const key of ALL_GENE_KEYS) {
    const pair = genotype[key];
    if (!pair) continue;

    const gene = GENE_REGISTRY[key];
    if (!gene) continue;

    const expr = resolveExpression(pair);

    // Apply dominant + recessive deltas
    applyDelta(acc, gene.dominantDelta, dominantMultiplier(expr));
    applyDelta(acc, gene.recessiveDelta, recessiveMultiplier(expr));

    // Check for rare expression
    const isRare =
      (gene.rareExpression === 'recessive' && expr === 'RR') ||
      (gene.rareExpression === 'dominant'  && expr === 'DD');
    if (isRare) rareCount++;
  }

  // Build result: clamp all base traits + inject rarityScore
  const result: Record<string, number> = {};
  for (const field of PHENOTYPE_FIELDS) {
    result[field] = clampTrait(field, acc[field] ?? base[field]);
  }
  result.rarityScore = rareCount / GENE_COUNT;

  return result as unknown as Phenotype;
}

// ─── Rarity Breakdown ─────────────────────────

export type RarityBreakdown = {
  rareGenes: Array<{ key: string; label: string; expression: AlleleExpression }>;
  rarityScore: number;
};

/**
 * Detailed rarity breakdown — useful for plant inspection UI.
 */
export function getRarityBreakdown(genotype: Genotype): RarityBreakdown {
  const rareGenes: RarityBreakdown['rareGenes'] = [];
  let rareCount = 0;

  for (const key of ALL_GENE_KEYS) {
    const pair = genotype[key];
    if (!pair) continue;
    const gene = GENE_REGISTRY[key];
    if (!gene) continue;

    const expr = resolveExpression(pair);
    const isRare =
      (gene.rareExpression === 'recessive' && expr === 'RR') ||
      (gene.rareExpression === 'dominant'  && expr === 'DD');

    if (isRare) {
      rareCount++;
      rareGenes.push({ key, label: gene.label, expression: expr });
    }
  }

  return {
    rareGenes,
    rarityScore: rareCount / GENE_COUNT,
  };
}

// ─── Mutation ─────────────────────────────────

/**
 * Mutate a single allele value with a given probability.
 * Mutation flips D↔R.
 */
function mutateAllele(allele: AlleleValue, rate: number): AlleleValue {
  return Math.random() < rate ? (allele === 'D' ? 'R' : 'D') : allele;
}

/**
 * Apply mutation to an entire genotype.
 * Each allele in each gene pair is independently evaluated.
 *
 * @param genotype     Source genotype (not mutated in place)
 * @param rateOverride Global mutation rate multiplier (1.0 = normal, >1 = more)
 * @returns New genotype with mutations applied
 */
export function applyMutation(
  genotype: Genotype,
  rateOverride = 1.0,
): Genotype {
  const mutated: Genotype = {};

  for (const key of ALL_GENE_KEYS) {
    const pair = genotype[key];
    if (!pair) continue;

    const gene = GENE_REGISTRY[key];
    const rate = (gene?.mutationRate ?? 0.02) * rateOverride;

    mutated[key] = [
      mutateAllele(pair[0], rate),
      mutateAllele(pair[1], rate),
    ];
  }

  return mutated;
}

// ─── Genotype Description ─────────────────────

/**
 * Human-readable genotype string, e.g. "DD DR RR DD DR ..."
 * Useful for debugging and future "Punnett UI".
 */
export function describeGenotype(genotype: Genotype): string {
  return ALL_GENE_KEYS
    .map((key) => {
      const pair = genotype[key];
      if (!pair) return '??';
      return resolveExpression(pair);
    })
    .join(' ');
}
