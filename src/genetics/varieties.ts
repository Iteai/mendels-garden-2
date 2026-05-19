// ─────────────────────────────────────────────
// src/genetics/varieties.ts
//
// Plant Varieties — pre-defined cultivar presets.
// 5 per species × 4 species = 20 named varieties.
//
// VALID GENE KEYS (from genes.ts): STATURE, FOLIAGE, VIGOR,
//   WATER_USE, LIGHT_USE, FRUIT_SIZE, YIELD, PIGMENT_A, PIGMENT_B, SEED_SET
//
// Each variety defines per-gene allele frequency biases
// that skew seed generation toward a specific cultivar type.
// ─────────────────────────────────────────────

import type { SpeciesId, Genotype, Phenotype } from '../types';
import { ALL_GENE_KEYS } from './genes';
import { getSpecies } from './species';
import { computePhenotype } from './genotype';

// ─── Types ────────────────────────────────────

export type VarietyDefinition = {
  id: string;
  speciesId: SpeciesId;
  displayName: string;
  description: string;
  /** Per-gene dominant allele probability (0–1). Only valid gene keys are used. */
  alleleFrequencies: Partial<Record<string, number>>;
  /** Expected rarity tier */
  rarityHint: 'common' | 'uncommon' | 'rare' | 'legendary';
};

// ─── TOMATO VARIETIES ─────────────────────────

const TOMATO_VARIETIES: VarietyDefinition[] = [
  {
    id: 'tomato_sweet_cherry',
    speciesId: 'tomato',
    displayName: 'Sweet Cherry',
    description: 'Compact clusters of bite-sized, intensely sweet fruits. Heavy yielder.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.25,
      YIELD:      0.80,
      VIGOR:      0.75,
      PIGMENT_A:  0.80,
      STATURE:    0.45,
    },
    rarityHint: 'common',
  },
  {
    id: 'tomato_beefsteak',
    speciesId: 'tomato',
    displayName: 'Beefsteak',
    description: 'Massive fruits on a robust vine. Lower quantity but impressive size.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.92,
      YIELD:      0.30,
      STATURE:    0.80,
      FOLIAGE:    0.75,
      WATER_USE:  0.60,
    },
    rarityHint: 'uncommon',
  },
  {
    id: 'tomato_golden_sunrise',
    speciesId: 'tomato',
    displayName: 'Golden Sunrise',
    description: 'Striking golden-yellow fruits with mild flavour. Unusual pigment.',
    alleleFrequencies: {
      PIGMENT_A:  0.15,
      PIGMENT_B:  0.20,
      FRUIT_SIZE: 0.50,
      YIELD:      0.55,
      LIGHT_USE:  0.65,
    },
    rarityHint: 'rare',
  },
  {
    id: 'tomato_black_krim',
    speciesId: 'tomato',
    displayName: 'Black Krim',
    description: 'Dramatic dark-purple fruits. Complex flavour. Rare heirloom.',
    alleleFrequencies: {
      PIGMENT_A:  0.10,
      PIGMENT_B:  0.08,
      FRUIT_SIZE: 0.65,
      SEED_SET:   0.40,
      VIGOR:      0.70,
    },
    rarityHint: 'legendary',
  },
  {
    id: 'tomato_roma',
    speciesId: 'tomato',
    displayName: 'Roma',
    description: 'Classic plum-type tomato bred for sauce. Reliable productivity.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.60,
      YIELD:      0.70,
      SEED_SET:   0.40,
      WATER_USE:  0.55,
      STATURE:    0.50,
      VIGOR:      0.65,
    },
    rarityHint: 'common',
  },
];

// ─── CHILI VARIETIES ──────────────────────────

const CHILI_VARIETIES: VarietyDefinition[] = [
  {
    id: 'chili_jalapeno',
    speciesId: 'chili',
    displayName: 'Jalapeño',
    description: 'Classic medium-heat chili. Thick-walled fruits. Reliable producer.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.55,
      YIELD:      0.65,
      PIGMENT_A:  0.70,
      STATURE:    0.40,
      FOLIAGE:    0.50,
    },
    rarityHint: 'common',
  },
  {
    id: 'chili_habanero',
    speciesId: 'chili',
    displayName: 'Habanero',
    description: 'Intensely hot with fruity notes. Lantern-shaped orange fruits.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.35,
      PIGMENT_A:  0.85,
      PIGMENT_B:  0.30,
      YIELD:      0.50,
      WATER_USE:  0.45,
    },
    rarityHint: 'uncommon',
  },
  {
    id: 'chili_cayenne',
    speciesId: 'chili',
    displayName: 'Cayenne',
    description: 'Long slender bright-red fruits. Vigorous and prolific.',
    alleleFrequencies: {
      STATURE:    0.60,
      YIELD:      0.80,
      FRUIT_SIZE: 0.30,
      VIGOR:      0.75,
      PIGMENT_A:  0.78,
    },
    rarityHint: 'common',
  },
  {
    id: 'chili_purple_beauty',
    speciesId: 'chili',
    displayName: 'Purple Beauty',
    description: 'Compact plant with striking purple foliage and dark violet fruits.',
    alleleFrequencies: {
      PIGMENT_A:  0.20,
      PIGMENT_B:  0.10,
      FOLIAGE:    0.60,
      STATURE:    0.30,
      VIGOR:      0.45,
    },
    rarityHint: 'rare',
  },
  {
    id: 'chili_carolina_reaper',
    speciesId: 'chili',
    displayName: 'Carolina Reaper',
    description: 'Extreme heat champion. Wrinkled fruits in vibrant red.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.40,
      YIELD:      0.35,
      PIGMENT_A:  0.90,
      VIGOR:      0.30,
      HARDINESS:  0.65,
    },
    rarityHint: 'legendary',
  },
];

// ─── BASIL VARIETIES ──────────────────────────

const BASIL_VARIETIES: VarietyDefinition[] = [
  {
    id: 'basil_genovese',
    speciesId: 'basil',
    displayName: 'Genovese',
    description: 'Classic Italian sweet basil. Large glossy deep-green leaves.',
    alleleFrequencies: {
      FOLIAGE:    0.80,
      VIGOR:      0.70,
      STATURE:    0.45,
      FRUIT_SIZE: 0.55,
      YIELD:      0.55,
    },
    rarityHint: 'common',
  },
  {
    id: 'basil_purple_ruby',
    speciesId: 'basil',
    displayName: 'Purple Ruby',
    description: 'Stunning deep-purple leaves with spicy aroma.',
    alleleFrequencies: {
      PIGMENT_A:  0.15,
      PIGMENT_B:  0.12,
      FOLIAGE:    0.70,
      STATURE:    0.35,
      LIGHT_USE:  0.55,
    },
    rarityHint: 'uncommon',
  },
  {
    id: 'basil_lemon',
    speciesId: 'basil',
    displayName: 'Lemon Basil',
    description: 'Citrus-scented leaves with refreshing flavour.',
    alleleFrequencies: {
      PIGMENT_A:  0.30,
      FOLIAGE:    0.60,
      STATURE:    0.40,
      LIGHT_USE:  0.55,
      WATER_USE:  0.55,
    },
    rarityHint: 'common',
  },
  {
    id: 'basil_thaï',
    speciesId: 'basil',
    displayName: 'Thai Basil',
    description: 'Anise-scented with purple stems and pink flowers.',
    alleleFrequencies: {
      STATURE:    0.55,
      PIGMENT_B:  0.25,
      PIGMENT_A:  0.50,
      FOLIAGE:    0.60,
      YIELD:      0.55,
    },
    rarityHint: 'uncommon',
  },
  {
    id: 'basil_spicy_globe',
    speciesId: 'basil',
    displayName: 'Spicy Globe',
    description: 'Compact dense mound of tiny leaves. Intensely spicy.',
    alleleFrequencies: {
      STATURE:    0.15,
      FOLIAGE:    0.90,
      VIGOR:      0.65,
      YIELD:      0.70,
      LIGHT_USE:  0.55,
    },
    rarityHint: 'rare',
  },
];

// ─── RADISH VARIETIES ─────────────────────────

const RADISH_VARIETIES: VarietyDefinition[] = [
  {
    id: 'radish_cherry_belle',
    speciesId: 'radish',
    displayName: 'Cherry Belle',
    description: 'Classic round red radish. Crisp white flesh, mild bite.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.50,
      FOLIAGE:    0.40,
      PIGMENT_A:  0.75,
      VIGOR:      0.80,
      SEED_SET:   0.60,
    },
    rarityHint: 'common',
  },
  {
    id: 'radish_watermelon',
    speciesId: 'radish',
    displayName: 'Watermelon',
    description: 'Large round radish with green exterior and pink-magenta interior.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.75,
      PIGMENT_A:  0.20,
      PIGMENT_B:  0.15,
      YIELD:      0.45,
      VIGOR:      0.55,
    },
    rarityHint: 'rare',
  },
  {
    id: 'radish_black_spanish',
    speciesId: 'radish',
    displayName: 'Black Spanish',
    description: 'Ancient variety with black skin and white flesh. Sharp bite.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.65,
      PIGMENT_A:  0.10,
      PIGMENT_B:  0.05,
      HARDINESS:  0.75,
      VIGOR:      0.45,
    },
    rarityHint: 'legendary',
  },
  {
    id: 'radish_french_breakfast',
    speciesId: 'radish',
    displayName: 'French Breakfast',
    description: 'Elegant oblong radish with red top and white tip.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.45,
      PIGMENT_A:  0.72,
      VIGOR:      0.75,
      FOLIAGE:    0.50,
      WATER_USE:  0.55,
    },
    rarityHint: 'common',
  },
  {
    id: 'radish_daikon_miyashige',
    speciesId: 'radish',
    displayName: 'Daikon Miyashige',
    description: 'Prized Japanese variety. Long tapered white root.',
    alleleFrequencies: {
      FRUIT_SIZE: 0.85,
      PIGMENT_A:  0.50,
      PIGMENT_B:  0.50,
      YIELD:      0.60,
      VIGOR:      0.50,
    },
    rarityHint: 'uncommon',
  },
];

// ─── Registry ─────────────────────────────────

export const VARIETY_REGISTRY: Record<string, VarietyDefinition> = {};

function registerVarieties(varieties: VarietyDefinition[]): void {
  for (const v of varieties) {
    VARIETY_REGISTRY[v.id] = v;
  }
}

registerVarieties(TOMATO_VARIETIES);
registerVarieties(CHILI_VARIETIES);
registerVarieties(BASIL_VARIETIES);
registerVarieties(RADISH_VARIETIES);

/** Get all varieties for a given species */
export function getVarietiesForSpecies(speciesId: SpeciesId): VarietyDefinition[] {
  return Object.values(VARIETY_REGISTRY).filter((v) => v.speciesId === speciesId);
}

/** Get a single variety by id */
export function getVariety(id: string): VarietyDefinition | undefined {
  return VARIETY_REGISTRY[id];
}

/** All variety IDs */
export const ALL_VARIETY_IDS = Object.keys(VARIETY_REGISTRY);

// ─── Seed Generation from Varieties ──────────

/**
 * Generate a seed from a variety definition.
 * Only uses valid gene keys from the gene pool — any unknown keys
 * in alleleFrequencies are silently ignored.
 */
export function generateVarietySeed(
  varietyId: string,
): { genotype: Genotype; phenotype: Phenotype } | null {
  const variety = getVariety(varietyId);
  if (!variety) return null;

  const species = getSpecies(variety.speciesId);
  const varietyFreqs = variety.alleleFrequencies as Record<string, number | undefined>;

  // Merge: variety overrides species defaults for valid gene keys only
  const mergedFreqs: Record<string, number> = {};
  for (const key of ALL_GENE_KEYS) {
    const override = varietyFreqs[key];
    mergedFreqs[key] = override !== undefined ? override
      : species.alleleFrequencies[key] ?? 0.5;
  }

  // Generate genotype from merged frequencies
  const genotype: Genotype = {};
  for (const key of ALL_GENE_KEYS) {
    const dFreq = mergedFreqs[key] ?? 0.5;
    genotype[key] = [
      Math.random() < dFreq ? 'D' : 'R',
      Math.random() < dFreq ? 'D' : 'R',
    ];
  }

  const phenotype = computePhenotype(genotype, variety.speciesId);
  return { genotype, phenotype };
}