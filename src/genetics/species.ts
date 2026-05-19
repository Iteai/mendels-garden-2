// ─────────────────────────────────────────────
// src/genetics/species.ts
//
// Species definitions.
// Each species has:
//   - basePhenotype: the trait baseline before any gene effects
//   - alleleFrequencies: per-gene probability that a random allele is 'D'
//     (used when generating wild-type or starter seeds)
//   - growthTicks: lifecycle stage durations
//   - resourceNeeds: per-tick consumption
//   - baseHue: HSL hue values for SVG rendering (Phase 3)
//
// Currently implemented: Tomato (full).
// Chili, Basil, Radish are stubbed — expanded in Phase 6.
// ─────────────────────────────────────────────

import type { SpeciesDefinition } from '../types';
import { ALL_GENE_KEYS } from './genes';

// ─── Helpers ──────────────────────────────────

/**
 * Build a complete allele frequency map.
 * Any gene not explicitly overridden defaults to 0.5 (50/50 D/R).
 */
function makeAlleleFreqs(
  overrides: Partial<Record<string, number>>,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of ALL_GENE_KEYS) {
    result[key] = overrides[key] ?? 0.5;
  }
  return result;
}

// ─── Species Definitions ──────────────────────

/**
 * TOMATO — Solanum lycopersicum
 *
 * Characteristics:
 *  - Medium-tall, branching indeterminate vine
 *  - Red/orange warm primary hue
 *  - High fruit count potential, moderate fruit size
 *  - Moderate water needs, good light tolerance
 *  - Good vigor, moderately fertile seeds
 *
 * Allele bias:
 *  - PIGMENT_A high D (tomatoes are warm-coloured)
 *  - VIGOR slightly D-biased (cultivated selection)
 *  - FRUIT_SIZE slightly R-biased (wild ancestor is small-fruited)
 *  - YIELD D-biased (cultivated for productivity)
 */
const TOMATO: SpeciesDefinition = {
  id: 'tomato',
  displayName: 'Tomato',
  description:
    'A vigorous vining plant prized for its warm-coloured fruits. ' +
    'Excellent genetic diversity with many possible trait expressions.',

  basePhenotype: {
    heightFactor:        0.50,
    stemThickness:       0.45,
    leafSize:            0.50,
    leafCount:           0.50,
    branchDensity:       0.45,
    flowerSize:          0.44,
    fruitSize:           0.40,
    fruitCount:          0.48,
    primaryColorShift:   0.00,
    secondaryColorShift: 0.00,
    saturationBoost:     0.50,
    growthRate:          0.50,
    waterEfficiency:     0.50,
    lightEfficiency:     0.50,
    hardiness:           0.50,
    yieldMultiplier:     1.00,
    seedViability:       0.60,
    rarityScore:         0.00, // computed — always 0 in base
  },

  geneKeys: ALL_GENE_KEYS,

  alleleFrequencies: makeAlleleFreqs({
    STATURE:    0.52,
    FOLIAGE:    0.54,
    VIGOR:      0.60, // cultivated = higher vigor
    WATER_USE:  0.48,
    LIGHT_USE:  0.50,
    FRUIT_SIZE: 0.40, // wild ancestor = small fruit
    YIELD:      0.58, // cultivated = higher yield
    PIGMENT_A:  0.72, // strong warm hue bias
    PIGMENT_B:  0.60,
    SEED_SET:   0.58,
  }),

  growthTicks: {
    seedToSprout:           12,  // ~1 min realtime at 5s/tick
    sproutToVegetative:     24,
    vegetativeToFlowering:  36,
    floweringToMature:      30,
    matureToDecay:          48,  // harvest window before decay
  },

  resourceNeeds: {
    water:     0.025,
    sunlight:  0.018,
    nutrients: 0.008,
  },

  baseHue: {
    stem:   110, // yellow-green
    leaf:   120, // green
    flower: 55,  // yellow
    fruit:  10,  // red-orange
  },
};

/**
 * CHILI — Capsicum annuum (stub — Phase 6)
 * Compact, upright, spicy phenotype.
 * High PIGMENT_A variance (red/orange/yellow/purple fruit).
 */
const CHILI: SpeciesDefinition = {
  id: 'chili',
  displayName: 'Chili',
  description: 'Compact upright plant with fiery fruit. Exceptional pigment variation.',

  basePhenotype: {
    heightFactor:        0.38,
    stemThickness:       0.40,
    leafSize:            0.40,
    leafCount:           0.44,
    branchDensity:       0.50,
    flowerSize:          0.35,
    fruitSize:           0.28,
    fruitCount:          0.55,
    primaryColorShift:   0.00,
    secondaryColorShift: 0.00,
    saturationBoost:     0.60,
    growthRate:          0.42,
    waterEfficiency:     0.58,
    lightEfficiency:     0.52,
    hardiness:           0.55,
    yieldMultiplier:     0.90,
    seedViability:       0.64,
    rarityScore:         0.00,
  },

  geneKeys: ALL_GENE_KEYS,

  alleleFrequencies: makeAlleleFreqs({
    STATURE:    0.35, // compact plants
    FOLIAGE:    0.50,
    VIGOR:      0.55,
    WATER_USE:  0.60, // drought tolerant
    LIGHT_USE:  0.54,
    FRUIT_SIZE: 0.35, // small but mighty
    YIELD:      0.52,
    PIGMENT_A:  0.65,
    PIGMENT_B:  0.55,
    SEED_SET:   0.60,
  }),

  growthTicks: {
    seedToSprout:           14,
    sproutToVegetative:     28,
    vegetativeToFlowering:  40,
    floweringToMature:      36,
    matureToDecay:          54,
  },

  resourceNeeds: {
    water:     0.018,
    sunlight:  0.022,
    nutrients: 0.007,
  },

  baseHue: {
    stem:   115,
    leaf:   122,
    flower: 60,
    fruit:  18, // orange-red
  },
};

/**
 * BASIL — Ocimum basilicum (stub — Phase 6)
 * Aromatic foliage plant. No fruit — yield is leaf harvest.
 * Fast-growing, shade tolerant.
 */
const BASIL: SpeciesDefinition = {
  id: 'basil',
  displayName: 'Basil',
  description: 'Aromatic herb with rapid growth and rich foliage. Harvested for leaves.',

  basePhenotype: {
    heightFactor:        0.30,
    stemThickness:       0.35,
    leafSize:            0.62,
    leafCount:           0.68,
    branchDensity:       0.58,
    flowerSize:          0.28,
    fruitSize:           0.10,
    fruitCount:          0.20,
    primaryColorShift:   0.00,
    secondaryColorShift: 0.00,
    saturationBoost:     0.55,
    growthRate:          0.70, // fast
    waterEfficiency:     0.45,
    lightEfficiency:     0.58,
    hardiness:           0.44,
    yieldMultiplier:     0.80, // leaf yield
    seedViability:       0.55,
    rarityScore:         0.00,
  },

  geneKeys: ALL_GENE_KEYS,

  alleleFrequencies: makeAlleleFreqs({
    STATURE:    0.30,
    FOLIAGE:    0.72, // high foliage expression
    VIGOR:      0.68,
    WATER_USE:  0.44,
    LIGHT_USE:  0.56,
    FRUIT_SIZE: 0.20,
    YIELD:      0.45,
    PIGMENT_A:  0.58,
    PIGMENT_B:  0.50,
    SEED_SET:   0.52,
  }),

  growthTicks: {
    seedToSprout:           8,
    sproutToVegetative:     16,
    vegetativeToFlowering:  24,
    floweringToMature:      20,
    matureToDecay:          36,
  },

  resourceNeeds: {
    water:     0.030,
    sunlight:  0.016,
    nutrients: 0.010,
  },

  baseHue: {
    stem:   118,
    leaf:   128, // deeper green
    flower: 50,
    fruit:  120,
  },
};

/**
 * RADISH — Raphanus sativus (stub — Phase 6)
 * Fast-cycling root vegetable. Very short lifecycle.
 * Root colour variance is the main genetic expression point.
 */
const RADISH: SpeciesDefinition = {
  id: 'radish',
  displayName: 'Radish',
  description: 'Rapid-cycling root vegetable with striking colour variation underground.',

  basePhenotype: {
    heightFactor:        0.22,
    stemThickness:       0.30,
    leafSize:            0.44,
    leafCount:           0.40,
    branchDensity:       0.28,
    flowerSize:          0.22,
    fruitSize:           0.50, // root = "fruit" in our model
    fruitCount:          0.30,
    primaryColorShift:   0.00,
    secondaryColorShift: 0.00,
    saturationBoost:     0.65,
    growthRate:          0.80, // very fast
    waterEfficiency:     0.52,
    lightEfficiency:     0.46,
    hardiness:           0.60,
    yieldMultiplier:     0.85,
    seedViability:       0.68,
    rarityScore:         0.00,
  },

  geneKeys: ALL_GENE_KEYS,

  alleleFrequencies: makeAlleleFreqs({
    STATURE:    0.25,
    FOLIAGE:    0.42,
    VIGOR:      0.72,
    WATER_USE:  0.54,
    LIGHT_USE:  0.48,
    FRUIT_SIZE: 0.55,
    YIELD:      0.48,
    PIGMENT_A:  0.55,
    PIGMENT_B:  0.50,
    SEED_SET:   0.65,
  }),

  growthTicks: {
    seedToSprout:           6,
    sproutToVegetative:     12,
    vegetativeToFlowering:  18,
    floweringToMature:      16,
    matureToDecay:          30,
  },

  resourceNeeds: {
    water:     0.022,
    sunlight:  0.014,
    nutrients: 0.012,
  },

  baseHue: {
    stem:   116,
    leaf:   120,
    flower: 300, // pale purple
    fruit:  355, // red root (hue near 0/360)
  },
};

// ─── Registry ─────────────────────────────────

export const SPECIES_REGISTRY: Record<string, SpeciesDefinition> = {
  tomato: TOMATO,
  chili:  CHILI,
  basil:  BASIL,
  radish: RADISH,
};

export function getSpecies(id: string): SpeciesDefinition {
  const species = SPECIES_REGISTRY[id];
  if (!species) throw new Error(`Unknown species: ${id}`);
  return species;
}

export const ALL_SPECIES_IDS = Object.keys(SPECIES_REGISTRY) as Array<keyof typeof SPECIES_REGISTRY>;
