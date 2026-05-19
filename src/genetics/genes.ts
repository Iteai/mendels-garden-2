// ─────────────────────────────────────────────
// src/genetics/genes.ts
//
// Gene pool — the complete set of heritable genes.
// Each gene defines how its alleles shift the phenotype
// via additive deltas applied on top of the species baseline.
//
// Expression model:
//   DD  → dominant delta × 1.0   (fully expressed)
//   DR  → dominant delta × 0.65  (partial dominance)
//   RR  → recessive delta × 1.0  (fully expressed recessive)
//
// Deltas are additive: phenotype[trait] = base + Σ(gene deltas)
// Each trait is then clamped to its valid range.
// ─────────────────────────────────────────────

import type { Phenotype } from '../types';

// ─── Types ────────────────────────────────────

/** Phenotype fields that genes can affect (excludes computed rarityScore) */
export type PhenotypeEffects = Omit<Phenotype, 'rarityScore'>;

/** Partial phenotype delta — only the traits a gene actually touches */
export type GeneDelta = Partial<PhenotypeEffects>;

/** Which allele combination is considered "rare" for rarity scoring */
export type RareExpression = 'dominant' | 'recessive';

export type GeneDefinition = {
  key: string;
  label: string;
  description: string;

  /** Effect when expressed (DD or partial DR) */
  dominantDelta: GeneDelta;
  /** Effect when recessive pair (RR) */
  recessiveDelta: GeneDelta;

  /** Per-allele mutation probability per generation */
  mutationRate: number;

  /**
   * Which expression is "rare".
   * 'recessive' = RR is unusual → adds to rarityScore
   * 'dominant'  = DD is unusual → adds to rarityScore
   */
  rareExpression: RareExpression;
};

// ─── Gene Pool ────────────────────────────────

/**
 * STATURE — controls overall plant scale and stem robustness.
 * Dominant: tall, thick-stemmed.
 * Recessive: dwarf, wiry.
 * Rare: recessive dwarf (uncommon in wild populations).
 */
const STATURE: GeneDefinition = {
  key: 'STATURE',
  label: 'Stature',
  description: 'Controls plant height and stem thickness',
  dominantDelta: { heightFactor: +0.25, stemThickness: +0.18 },
  recessiveDelta: { heightFactor: -0.22, stemThickness: -0.14 },
  mutationRate: 0.02,
  rareExpression: 'recessive',
};

/**
 * FOLIAGE — controls leaf expression and branching architecture.
 * Dominant: lush, dense canopy.
 * Recessive: sparse, open structure.
 */
const FOLIAGE: GeneDefinition = {
  key: 'FOLIAGE',
  label: 'Foliage',
  description: 'Controls leaf size, count, and branch density',
  dominantDelta: { leafSize: +0.20, leafCount: +0.18, branchDensity: +0.15 },
  recessiveDelta: { leafSize: -0.15, leafCount: -0.12, branchDensity: -0.12 },
  mutationRate: 0.03,
  rareExpression: 'recessive',
};

/**
 * VIGOR — growth rate and environmental resilience.
 * Dominant: fast-growing and hardy.
 * Recessive: slow, delicate.
 */
const VIGOR: GeneDefinition = {
  key: 'VIGOR',
  label: 'Vigor',
  description: 'Growth rate and hardiness under stress',
  dominantDelta: { growthRate: +0.20, hardiness: +0.16 },
  recessiveDelta: { growthRate: -0.16, hardiness: -0.12 },
  mutationRate: 0.01,
  rareExpression: 'recessive',
};

/**
 * WATER_USE — drought tolerance.
 * Dominant: efficient water use, drought resistant.
 * Recessive: high water demand, wilts quickly.
 */
const WATER_USE: GeneDefinition = {
  key: 'WATER_USE',
  label: 'Water Use',
  description: 'Drought tolerance and water efficiency',
  dominantDelta: { waterEfficiency: +0.30 },
  recessiveDelta: { waterEfficiency: -0.22 },
  mutationRate: 0.02,
  rareExpression: 'dominant', // very high efficiency is the rare extreme
};

/**
 * LIGHT_USE — light capture efficiency.
 * Dominant: shade tolerant, broad spectrum capture.
 * Recessive: full-sun dependent.
 */
const LIGHT_USE: GeneDefinition = {
  key: 'LIGHT_USE',
  label: 'Light Use',
  description: 'Shade tolerance and light capture efficiency',
  dominantDelta: { lightEfficiency: +0.25 },
  recessiveDelta: { lightEfficiency: -0.16 },
  mutationRate: 0.02,
  rareExpression: 'dominant',
};

/**
 * FRUIT_SIZE — individual fruit mass and flower scale.
 * Dominant: large fruit and bold flowers.
 * Recessive: small fruit, petite flowers.
 * Higher mutation rate — fruit size varies a lot in nature.
 */
const FRUIT_SIZE: GeneDefinition = {
  key: 'FRUIT_SIZE',
  label: 'Fruit Size',
  description: 'Individual fruit size and flower prominence',
  dominantDelta: { fruitSize: +0.28, flowerSize: +0.14 },
  recessiveDelta: { fruitSize: -0.20, flowerSize: -0.10 },
  mutationRate: 0.04,
  rareExpression: 'dominant', // giant fruit is the rare trait
};

/**
 * YIELD — fruit count and total harvest multiplier.
 * Dominant: high fruit count, productive plant.
 * Recessive: fewer fruits, but resources may concentrate.
 */
const YIELD: GeneDefinition = {
  key: 'YIELD',
  label: 'Yield',
  description: 'Fruit count and harvest yield multiplier',
  dominantDelta: { fruitCount: +0.20, yieldMultiplier: +0.30 },
  recessiveDelta: { fruitCount: -0.14, yieldMultiplier: -0.22 },
  mutationRate: 0.03,
  rareExpression: 'dominant',
};

/**
 * PIGMENT_A — primary pigmentation (dominant color expression).
 * Dominant: deep, warm, saturated primary colour.
 * Recessive: muted, cool, shifted primary colour.
 * High mutation rate — colour is evolutionarily plastic.
 */
const PIGMENT_A: GeneDefinition = {
  key: 'PIGMENT_A',
  label: 'Primary Pigment',
  description: 'Primary colour intensity and warm/cool shift',
  dominantDelta: { primaryColorShift: +0.35, saturationBoost: +0.28 },
  recessiveDelta: { primaryColorShift: -0.30, saturationBoost: -0.18 },
  mutationRate: 0.05,
  rareExpression: 'recessive', // cool / muted is unusual
};

/**
 * PIGMENT_B — secondary / accent pigmentation.
 * Dominant: warm amber/gold accent tones.
 * Recessive: cool violet/blue accent tones (the unusual mutation).
 */
const PIGMENT_B: GeneDefinition = {
  key: 'PIGMENT_B',
  label: 'Accent Pigment',
  description: 'Secondary accent colour — warm vs. cool shift',
  dominantDelta: { secondaryColorShift: +0.25 },
  recessiveDelta: { secondaryColorShift: -0.45 }, // dramatic cool shift = rare
  mutationRate: 0.06,
  rareExpression: 'recessive', // violet accent is the rare prize
};

/**
 * SEED_SET — seed viability and germination quality.
 * Dominant: fertile, high-viability seeds.
 * Recessive: reduced fertility, fewer viable seeds per harvest.
 */
const SEED_SET: GeneDefinition = {
  key: 'SEED_SET',
  label: 'Seed Set',
  description: 'Seed viability after harvest',
  dominantDelta: { seedViability: +0.24 },
  recessiveDelta: { seedViability: -0.28 },
  mutationRate: 0.015,
  rareExpression: 'recessive',
};

// ─── Registry ─────────────────────────────────

/** Ordered list of all gene definitions */
export const GENE_POOL: GeneDefinition[] = [
  STATURE,
  FOLIAGE,
  VIGOR,
  WATER_USE,
  LIGHT_USE,
  FRUIT_SIZE,
  YIELD,
  PIGMENT_A,
  PIGMENT_B,
  SEED_SET,
];

/** Lookup by key — O(1) access */
export const GENE_REGISTRY: Record<string, GeneDefinition> = Object.fromEntries(
  GENE_POOL.map((g) => [g.key, g]),
);

/** All gene keys in canonical order */
export const ALL_GENE_KEYS: string[] = GENE_POOL.map((g) => g.key);

/** Total number of genes */
export const GENE_COUNT = GENE_POOL.length;

// ─── Valid ranges per phenotype trait ─────────

/**
 * Clamping bounds for each phenotype trait after gene deltas are applied.
 * Traits not listed here are clamped to [0, 1] by default.
 */
export const PHENOTYPE_RANGES: Partial<Record<keyof PhenotypeEffects, [number, number]>> = {
  primaryColorShift:   [-1, 1],
  secondaryColorShift: [-1, 1],
  yieldMultiplier:     [0, 2],
};

/** Get the valid [min, max] range for a phenotype trait */
export function getTraitRange(trait: keyof PhenotypeEffects): [number, number] {
  return PHENOTYPE_RANGES[trait] ?? [0, 1];
}
