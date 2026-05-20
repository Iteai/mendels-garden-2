// ─────────────────────────────────────────────
// src/genetics/varieties.ts
//
// Variety (cultivar) definitions for each species.
// 5 varieties per species × 4 species = 20 unique plant types.
//
// Each variety defines:
//   - basePhenotypeOffsets: deltas applied on top of species basePhenotype
//     (these make Cherry tomatoes small+prolific vs Beefsteak large+few)
//   - alleleFreqOverrides: which alleles are more common in this variety
//     (a Bell pepper has different pigment/size freq than a Cayenne)
//   - baseHue: optional color overrides for SVG rendering distinctiveness
// ─────────────────────────────────────────────

import type { VarietyDefinition } from '../types';
import { ALL_GENE_KEYS } from './genes';

// ─── Helper ───────────────────────────────────

/**
 * Create a variety definition with typed fields.
 */
function variety(def: VarietyDefinition): VarietyDefinition {
  return def;
}

// ─── TOMATO VARIETIES ──────────────────────────

export const TOMATO_BEEFSTEAK = variety({
  id: 'tomato_beefsteak',
  speciesId: 'tomato',
  displayName: 'Beefsteak',
  description: 'Massive ribbed fruits up to 1kg each. A showstopper on the vine.',
  basePhenotypeOffsets: {
    fruitSize: +0.30,
    fruitCount: -0.30,
    stemThickness: +0.15,
    heightFactor: +0.10,
    growthRate: -0.08,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.80,
    YIELD: 0.45,
    VIGOR: 0.55,
  },
});

export const TOMATO_CHERRY = variety({
  id: 'tomato_cherry',
  speciesId: 'tomato',
  displayName: 'Cherry',
  description: 'Bite-sized fruits bursting with sweetness. Prolific and vigorous.',
  basePhenotypeOffsets: {
    fruitSize: -0.20,
    fruitCount: +0.35,
    growthRate: +0.10,
    branchDensity: +0.10,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.20,
    YIELD: 0.70,
    VIGOR: 0.65,
  },
});

export const TOMATO_ROMA = variety({
  id: 'tomato_roma',
  speciesId: 'tomato',
  displayName: 'Roma',
  description: 'Classic paste tomato with dense flesh and few seeds. Ideal for sauces.',
  basePhenotypeOffsets: {
    fruitSize: +0.05,
    fruitCount: +0.15,
    seedViability: -0.10,
    waterEfficiency: +0.12,
    hardiness: +0.10,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.50,
    YIELD: 0.60,
    SEED_SET: 0.40,
    WATER_USE: 0.60,
  },
});

export const TOMATO_BRANDYWINE = variety({
  id: 'tomato_brandywine',
  speciesId: 'tomato',
  displayName: 'Brandywine',
  description: 'Heritage variety prized for complex flavour. Pinkish fruit, lower yield.',
  basePhenotypeOffsets: {
    fruitSize: +0.20,
    fruitCount: -0.20,
    primaryColorShift: -0.25, // pinkish shift
    growthRate: -0.12,
    hardiness: +0.06,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.65,
    YIELD: 0.35,
    VIGOR: 0.45,
    PIGMENT_A: 0.30, // more recessive = muted pink tones
  },
  baseHue: {
    fruit: 350, // pink-red
  },
});

export const TOMATO_SAN_MARZANO = variety({
  id: 'tomato_san_marzano',
  speciesId: 'tomato',
  displayName: 'San Marzano',
  description: 'Elongated plum tomato from Italy. Sweet, low acidity, premium flavour.',
  basePhenotypeOffsets: {
    fruitSize: +0.08,
    fruitCount: +0.10,
    seedViability: +0.08,
    yieldMultiplier: +0.15,
    saturationBoost: +0.10,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.55,
    YIELD: 0.65,
    SEED_SET: 0.60,
    PIGMENT_A: 0.75,
  },
});

// ─── CHILI (PEPPER) VARIETIES ──────────────────

export const CHILI_CAYENNE = variety({
  id: 'chili_cayenne',
  speciesId: 'chili',
  displayName: 'Cayenne',
  description: 'Long, thin, fiery red peppers. Heat-focused with vigorous growth.',
  basePhenotypeOffsets: {
    fruitSize: +0.10,
    fruitCount: +0.25,
    saturationBoost: +0.15,
    primaryColorShift: +0.10,
    growthRate: +0.08,
    waterEfficiency: +0.10,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.45,
    YIELD: 0.60,
    WATER_USE: 0.65,
    PIGMENT_A: 0.70,
  },
});

export const CHILI_BELL = variety({
  id: 'chili_bell',
  speciesId: 'chili',
  displayName: 'Bell',
  description: 'Blocky, sweet peppers with thick walls. Zero heat, maximum crunch.',
  basePhenotypeOffsets: {
    fruitSize: +0.30,
    fruitCount: -0.10,
    stemThickness: +0.12,
    leafSize: +0.10,
    waterEfficiency: -0.08,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.75,
    YIELD: 0.50,
    WATER_USE: 0.40,
    VIGOR: 0.50,
  },
});

export const CHILI_JALAPENO = variety({
  id: 'chili_jalapeno',
  speciesId: 'chili',
  displayName: 'Jalapeño',
  description: 'Medium-heat pepper with thick flesh. Smoky flavour, prolific on the bush.',
  basePhenotypeOffsets: {
    fruitSize: +0.15,
    fruitCount: +0.20,
    saturationBoost: +0.08,
    primaryColorShift: -0.05,
    hardiness: +0.10,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.55,
    YIELD: 0.60,
    PIGMENT_A: 0.60,
    WATER_USE: 0.55,
  },
});

export const CHILI_HABANERO = variety({
  id: 'chili_habanero',
  speciesId: 'chili',
  displayName: 'Habanero',
  description: 'Extreme heat with fruity, floral notes. Small lantern-shaped fruit.',
  basePhenotypeOffsets: {
    fruitSize: -0.10,
    fruitCount: +0.30,
    saturationBoost: +0.20,
    primaryColorShift: +0.20,
    secondaryColorShift: +0.15,
    growthRate: -0.05,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.25,
    YIELD: 0.65,
    PIGMENT_A: 0.65,
    PIGMENT_B: 0.60,
  },
  baseHue: {
    fruit: 25, // orange
  },
});

export const CHILI_POBLANO = variety({
  id: 'chili_poblano',
  speciesId: 'chili',
  displayName: 'Poblano',
  description: 'Mild, rich-flavoured dark green pepper. Large heart-shaped fruit.',
  basePhenotypeOffsets: {
    fruitSize: +0.25,
    fruitCount: -0.05,
    primaryColorShift: -0.30, // dark green
    saturationBoost: -0.10,
    stemThickness: +0.10,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.70,
    YIELD: 0.45,
    PIGMENT_A: 0.35, // recessive = muted green tones
    VIGOR: 0.55,
  },
  baseHue: {
    fruit: 140, // green
  },
});

// ─── BASIL VARIETIES ──────────────────────────

export const BASIL_GENOVESE = variety({
  id: 'basil_genovese',
  speciesId: 'basil',
  displayName: 'Genovese',
  description: 'Classic Italian sweet basil. Large fragrant leaves, essential for pesto.',
  basePhenotypeOffsets: {
    leafSize: +0.15,
    leafCount: +0.10,
    branchDensity: +0.10,
    heightFactor: +0.08,
    growthRate: +0.05,
  },
  alleleFreqOverrides: {
    FOLIAGE: 0.70,
    STATURE: 0.55,
    VIGOR: 0.65,
  },
});

export const BASIL_THAI = variety({
  id: 'basil_thai',
  speciesId: 'basil',
  displayName: 'Thai',
  description: 'Anise-liquorice aroma with purple stems and pink-purple flowers.',
  basePhenotypeOffsets: {
    leafSize: -0.05,
    leafCount: +0.15,
    flowerSize: +0.10,
    secondaryColorShift: -0.35, // purple tones
    saturationBoost: +0.15,
    stemThickness: +0.08,
  },
  alleleFreqOverrides: {
    FOLIAGE: 0.60,
    PIGMENT_B: 0.35, // recessive purple accent
    STATURE: 0.50,
  },
  baseHue: {
    stem: 300, // purple
    flower: 310, // pink-purple
  },
});

export const BASIL_LEMON = variety({
  id: 'basil_lemon',
  speciesId: 'basil',
  displayName: 'Lemon',
  description: 'Bright citrus aroma. Pale green leaves, white flowers, compact growth.',
  basePhenotypeOffsets: {
    leafSize: -0.05,
    leafCount: +0.05,
    heightFactor: -0.10,
    primaryColorShift: -0.20, // paler
    saturationBoost: -0.15,
    growthRate: +0.10,
  },
  alleleFreqOverrides: {
    FOLIAGE: 0.55,
    STATURE: 0.35,
    VIGOR: 0.70,
    PIGMENT_A: 0.40,
  },
  baseHue: {
    leaf: 100, // pale green
  },
});

export const BASIL_PURPLE_OPAL = variety({
  id: 'basil_purple_opal',
  speciesId: 'basil',
  displayName: 'Purple Opal',
  description: 'Stunning deep purple foliage. Mild flavour, spectacular ornamental value.',
  basePhenotypeOffsets: {
    leafSize: +0.05,
    leafCount: +0.05,
    primaryColorShift: -0.50, // strong purple
    saturationBoost: +0.25,
    secondaryColorShift: -0.30,
    growthRate: -0.05,
  },
  alleleFreqOverrides: {
    PIGMENT_A: 0.25, // recessive = purple
    PIGMENT_B: 0.30,
    FOLIAGE: 0.60,
    VIGOR: 0.50,
  },
  baseHue: {
    leaf: 290, // purple
    stem: 280,
  },
});

export const BASIL_CINNAMON = variety({
  id: 'basil_cinnamon',
  speciesId: 'basil',
  displayName: 'Cinnamon',
  description: 'Spicy cinnamon-clove scent. Red-veined leaves, dark purple flower spikes.',
  basePhenotypeOffsets: {
    leafSize: +0.05,
    leafCount: -0.05,
    heightFactor: +0.15,
    secondaryColorShift: -0.20,
    saturationBoost: +0.10,
    flowerSize: +0.12,
  },
  alleleFreqOverrides: {
    STATURE: 0.60,
    FOLIAGE: 0.50,
    PIGMENT_B: 0.40,
    VIGOR: 0.55,
  },
  baseHue: {
    flower: 290,
  },
});

// ─── RADISH VARIETIES ─────────────────────────

export const RADISH_DAIKON = variety({
  id: 'radish_daikon',
  speciesId: 'radish',
  displayName: 'Daikon',
  description: 'Massive white Asian radish. Mild flavour, can exceed 45cm in length.',
  basePhenotypeOffsets: {
    fruitSize: +0.40,  // root size
    fruitCount: -0.15,
    heightFactor: +0.20,
    leafSize: +0.15,
    primaryColorShift: -0.30, // white
    saturationBoost: -0.20,
    growthRate: +0.05,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.80,
    YIELD: 0.40,
    STATURE: 0.55,
    PIGMENT_A: 0.20, // white = recessive
    VIGOR: 0.65,
  },
  baseHue: {
    fruit: 0, // white (achromatic)
  },
});

export const RADISH_CHERRY_BELLE = variety({
  id: 'radish_cherry_belle',
  speciesId: 'radish',
  displayName: 'Cherry Belle',
  description: 'Classic round red radish. Crisp white flesh, quick to mature.',
  basePhenotypeOffsets: {
    fruitSize: +0.05,
    fruitCount: +0.15,
    primaryColorShift: +0.15,
    saturationBoost: +0.10,
    growthRate: +0.08,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.50,
    YIELD: 0.55,
    PIGMENT_A: 0.70,
    VIGOR: 0.70,
  },
});

export const RADISH_FRENCH_BREAKFAST = variety({
  id: 'radish_french_breakfast',
  speciesId: 'radish',
  displayName: 'French Breakfast',
  description: 'Oblong, red-topped radish with white tip. Mild, peppery, elegant.',
  basePhenotypeOffsets: {
    fruitSize: +0.10,
    fruitCount: +0.10,
    primaryColorShift: +0.10,
    secondaryColorShift: +0.05,
    saturationBoost: +0.10,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.55,
    YIELD: 0.50,
    PIGMENT_A: 0.65,
    PIGMENT_B: 0.55,
  },
  baseHue: {
    fruit: 360, // red with white tip
  },
});

export const RADISH_WATERMELON = variety({
  id: 'radish_watermelon',
  speciesId: 'radish',
  displayName: 'Watermelon',
  description: 'Stunning green outer skin reveals vivid pink-magenta flesh inside.',
  basePhenotypeOffsets: {
    fruitSize: +0.15,
    fruitCount: -0.05,
    primaryColorShift: -0.25, // green skin
    secondaryColorShift: +0.35, // pink flesh
    saturationBoost: +0.20,
    growthRate: -0.05,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.60,
    YIELD: 0.45,
    PIGMENT_A: 0.35,
    PIGMENT_B: 0.75, // strong pink secondary
  },
  baseHue: {
    fruit: 140, // green
  },
});

export const RADISH_BLACK_SPANISH = variety({
  id: 'radish_black_spanish',
  speciesId: 'radish',
  displayName: 'Black Spanish',
  description: 'Rare heirloom with jet-black skin and pure white flesh. Sharp, earthy flavour.',
  basePhenotypeOffsets: {
    fruitSize: +0.20,
    fruitCount: -0.10,
    primaryColorShift: -0.60, // very dark
    saturationBoost: -0.30,
    hardiness: +0.15,
    growthRate: -0.10,
  },
  alleleFreqOverrides: {
    FRUIT_SIZE: 0.65,
    YIELD: 0.40,
    PIGMENT_A: 0.10, // very recessive = black
    VIGOR: 0.50,
    SEED_SET: 0.55,
  },
  baseHue: {
    fruit: 30, // dark brown-black
  },
});

// ─── VARIETY REGISTRY ─────────────────────────

export const VARIETY_REGISTRY: Record<string, VarietyDefinition> = {
  // Tomatoes
  tomato_beefsteak: TOMATO_BEEFSTEAK,
  tomato_cherry: TOMATO_CHERRY,
  tomato_roma: TOMATO_ROMA,
  tomato_brandywine: TOMATO_BRANDYWINE,
  tomato_san_marzano: TOMATO_SAN_MARZANO,

  // Chili
  chili_cayenne: CHILI_CAYENNE,
  chili_bell: CHILI_BELL,
  chili_jalapeno: CHILI_JALAPENO,
  chili_habanero: CHILI_HABANERO,
  chili_poblano: CHILI_POBLANO,

  // Basil
  basil_genovese: BASIL_GENOVESE,
  basil_thai: BASIL_THAI,
  basil_lemon: BASIL_LEMON,
  basil_purple_opal: BASIL_PURPLE_OPAL,
  basil_cinnamon: BASIL_CINNAMON,

  // Radish
  radish_daikon: RADISH_DAIKON,
  radish_cherry_belle: RADISH_CHERRY_BELLE,
  radish_french_breakfast: RADISH_FRENCH_BREAKFAST,
  radish_watermelon: RADISH_WATERMELON,
  radish_black_spanish: RADISH_BLACK_SPANISH,
};

/** Get a variety definition by ID */
export function getVariety(id: string): VarietyDefinition {
  const v = VARIETY_REGISTRY[id];
  if (!v) throw new Error(`Unknown variety: ${id}`);
  return v;
}

/** Get all variety IDs for a given species */
export function getVarietiesForSpecies(speciesId: string): VarietyDefinition[] {
  return Object.values(VARIETY_REGISTRY).filter((v) => v.speciesId === speciesId);
}

/** Default variety per species (the first one defined) */
export function getDefaultVariety(speciesId: string): string {
  const varieties = getVarietiesForSpecies(speciesId);
  return varieties[0]?.id ?? `${speciesId}_beefsteak`;
}