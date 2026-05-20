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
//   - baseHue: HSL hue values for SVG rendering
//   - varietyIds: which cultivars belong to this species
//
// 4 species, each with 5 varieties defined in varieties.ts.
// ─────────────────────────────────────────────

import type { SpeciesDefinition } from '../types';
import { ALL_GENE_KEYS } from './genes';

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
 *
 * Cultivars: Beefsteak, Cherry, Roma, Brandywine, San Marzano
 */
const TOMATO: SpeciesDefinition = {
  id: 'tomato',
  displayName: 'Tomato',
  description:
    'A vigorous vining plant prized for its warm-coloured fruits. ' +
    'Excellent genetic diversity with many possible trait expressions.',

  varietyIds: [
    'tomato_beefsteak',
    'tomato_cherry',
    'tomato_roma',
    'tomato_brandywine',
    'tomato_san_marzano',
  ],

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
 * CHILI — Capsicum annuum
 * Compact, upright, spicy phenotype.
 * High PIGMENT_A variance (red/orange/yellow/purple fruit).
 *
 * Cultivars: Cayenne, Bell, Jalapeño, Habanero, Poblano
 */
const CHILI: SpeciesDefinition = {
  id: 'chili',
  displayName: 'Chili',
  description: 'Compact upright plant with fiery fruit. Exceptional pigment variation.',

  varietyIds: [
    'chili_cayenne',
    'chili_bell',
    'chili_jalapeno',
    'chili_habanero',
    'chili_poblano',
  ],

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
 * BASIL — Ocimum basilicum
 * Aromatic foliage plant. No fruit — yield is leaf harvest.
 * Fast-growing, shade tolerant.
 *
 * Cultivars: Genovese, Thai, Lemon, Purple Opal, Cinnamon
 */
const BASIL: SpeciesDefinition = {
  id: 'basil',
  displayName: 'Basil',
  description: 'Aromatic herb with rapid growth and rich foliage. Harvested for leaves.',

  varietyIds: [
    'basil_genovese',
    'basil_thai',
    'basil_lemon',
    'basil_purple_opal',
    'basil_cinnamon',
  ],

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
 * RADISH — Raphanus sativus
 * Fast-cycling root vegetable. Very short lifecycle.
 * Root colour variance is the main genetic expression point.
 *
 * Cultivars: Daikon, Cherry Belle, French Breakfast, Watermelon, Black Spanish
 */
const RADISH: SpeciesDefinition = {
  id: 'radish',
  displayName: 'Radish',
  description: 'Rapid-cycling root vegetable with striking colour variation underground.',

  varietyIds: [
    'radish_daikon',
    'radish_cherry_belle',
    'radish_french_breakfast',
    'radish_watermelon',
    'radish_black_spanish',
  ],

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
