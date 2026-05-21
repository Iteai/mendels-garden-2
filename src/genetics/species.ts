// ─────────────────────────────────────────────
// src/genetics/species.ts
// 20 plant varieties across 4 families.
// Each variety has unique trait baselines,
// allele frequency biases, growth timing,
// and colour DNA.
// ─────────────────────────────────────────────

import type { SpeciesDefinition, SpeciesId, SpeciesFamily, Phenotype } from '../types';
import { ALL_GENE_KEYS } from './genes';

// ─── Helpers ──────────────────────────────────

const BASE_PHENOTYPE: Phenotype = {
  heightFactor: 0.50, stemThickness: 0.45,
  leafSize: 0.50, leafCount: 0.50, branchDensity: 0.45,
  flowerSize: 0.44, fruitSize: 0.40, fruitCount: 0.48,
  primaryColorShift: 0.00, secondaryColorShift: 0.00,
  saturationBoost: 0.50, growthRate: 0.50,
  waterEfficiency: 0.50, lightEfficiency: 0.50,
  hardiness: 0.50, yieldMultiplier: 1.00,
  seedViability: 0.60, rarityScore: 0.00,
};

function ph(overrides: Partial<Phenotype>): Phenotype {
  return { ...BASE_PHENOTYPE, ...overrides };
}

function freqs(overrides: Partial<Record<string, number>>): Record<string, number> {
  const defaults: Record<string, number> = {};
  ALL_GENE_KEYS.forEach((k) => { defaults[k] = 0.50; });
  return { ...defaults, ...overrides };
}

function ticks(scale: number, overrides?: Partial<SpeciesDefinition['growthTicks']>): SpeciesDefinition['growthTicks'] {
  return {
    seedToSprout:          Math.round(12 * scale),
    sproutToVegetative:    Math.round(24 * scale),
    vegetativeToFlowering: Math.round(36 * scale),
    floweringToMature:     Math.round(30 * scale),
    matureToDecay:         Math.round(48 * scale),
    ...overrides,
  };
}

// ─── Family helpers ───────────────────────────

export function getSpeciesFamily(id: SpeciesId): SpeciesFamily {
  if (id.startsWith('tomato')) return 'tomato';
  if (id.startsWith('chili'))  return 'chili';
  if (id.startsWith('basil'))  return 'basil';
  return 'radish';
}

// ─── TOMATO FAMILY ────────────────────────────

const TOMATO_CHERRY: SpeciesDefinition = {
  id: 'tomato_cherry', family: 'tomato', variety: 'Cherry', displayName: 'Cherry Tomato',
  description: 'Prolific, sweet, bite-sized fruits on a vigorous vine. The most beginner-friendly tomato.',
  basePhenotype: ph({ fruitSize:0.22, fruitCount:0.82, growthRate:0.62, heightFactor:0.52, yieldMultiplier:1.30 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ VIGOR:0.62, FRUIT_SIZE:0.20, YIELD:0.75, PIGMENT_A:0.70, SEED_SET:0.60 }),
  growthTicks: ticks(0.85),
  resourceNeeds: { water:0.024, sunlight:0.018, nutrients:0.008 },
  baseHue: { stem:110, leaf:122, flower:55, fruit:10 },
};

const TOMATO_BEEFSTEAK: SpeciesDefinition = {
  id: 'tomato_beefsteak', family: 'tomato', variety: 'Beefsteak', displayName: 'Beefsteak Tomato',
  description: 'Enormous, meaty fruits on a tall vine. Slow but the harvest is spectacular.',
  basePhenotype: ph({ fruitSize:0.78, fruitCount:0.22, growthRate:0.36, heightFactor:0.72, yieldMultiplier:0.85 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ STATURE:0.72, FRUIT_SIZE:0.80, YIELD:0.32, VIGOR:0.42, PIGMENT_A:0.68 }),
  growthTicks: ticks(1.40),
  resourceNeeds: { water:0.030, sunlight:0.022, nutrients:0.012 },
  baseHue: { stem:110, leaf:120, flower:54, fruit:6 },
};

const TOMATO_ROMA: SpeciesDefinition = {
  id: 'tomato_roma', family: 'tomato', variety: 'Roma', displayName: 'Roma Tomato',
  description: 'Dense, paste-type fruits in tight clusters. Drought-tolerant and reliable.',
  basePhenotype: ph({ fruitSize:0.46, fruitCount:0.58, waterEfficiency:0.60, saturationBoost:0.65 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ WATER_USE:0.65, YIELD:0.60, PIGMENT_A:0.78, FRUIT_SIZE:0.45, FOLIAGE:0.54 }),
  growthTicks: ticks(1.10),
  resourceNeeds: { water:0.020, sunlight:0.018, nutrients:0.009 },
  baseHue: { stem:110, leaf:122, flower:55, fruit:16 },
};

const TOMATO_HEIRLOOM: SpeciesDefinition = {
  id: 'tomato_heirloom', family: 'tomato', variety: 'Heirloom', displayName: 'Heirloom Tomato',
  description: 'Ancient genetics with wild colour variation. Every plant is unique — treasured by collectors.',
  basePhenotype: ph({ fruitSize:0.55, fruitCount:0.42, saturationBoost:0.72, leafSize:0.55 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ PIGMENT_A:0.48, PIGMENT_B:0.40, FRUIT_SIZE:0.52, STATURE:0.55, VIGOR:0.55 }),
  growthTicks: ticks(1.15),
  resourceNeeds: { water:0.026, sunlight:0.020, nutrients:0.010 },
  baseHue: { stem:110, leaf:120, flower:55, fruit:5 },
};

const TOMATO_YELLOW_PEAR: SpeciesDefinition = {
  id: 'tomato_yellow_pear', family: 'tomato', variety: 'Yellow Pear', displayName: 'Yellow Pear Tomato',
  description: 'Delicate pear-shaped fruits in sunny yellow clusters. Sweet, prolific, and unusual.',
  basePhenotype: ph({ fruitSize:0.28, fruitCount:0.72, seedViability:0.72, saturationBoost:0.58, growthRate:0.55 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ PIGMENT_A:0.18, YIELD:0.70, FRUIT_SIZE:0.22, SEED_SET:0.68, FOLIAGE:0.56 }),
  growthTicks: ticks(0.95),
  resourceNeeds: { water:0.022, sunlight:0.018, nutrients:0.008 },
  baseHue: { stem:112, leaf:124, flower:52, fruit:52 },
};

// ─── CHILI FAMILY ─────────────────────────────

const CHILI_CAYENNE: SpeciesDefinition = {
  id: 'chili_cayenne', family: 'chili', variety: 'Cayenne', displayName: 'Cayenne Pepper',
  description: 'Long, slender, fiery red peppers on an upright plant. High saturation, medium heat.',
  basePhenotype: ph({ fruitSize:0.40, fruitCount:0.62, saturationBoost:0.72, heightFactor:0.45, stemThickness:0.40 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ PIGMENT_A:0.80, YIELD:0.58, VIGOR:0.60, WATER_USE:0.56, FRUIT_SIZE:0.42 }),
  growthTicks: ticks(1.00),
  resourceNeeds: { water:0.020, sunlight:0.022, nutrients:0.008 },
  baseHue: { stem:116, leaf:122, flower:58, fruit:8 },
};

const CHILI_JALAPENO: SpeciesDefinition = {
  id: 'chili_jalapeno', family: 'chili', variety: 'Jalapeño', displayName: 'Jalapeño',
  description: 'Classic medium pepper, green until fully ripe. Compact, productive, and versatile.',
  basePhenotype: ph({ fruitSize:0.52, fruitCount:0.52, heightFactor:0.38, branchDensity:0.52 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ FRUIT_SIZE:0.55, PIGMENT_A:0.45, PIGMENT_B:0.55, VIGOR:0.58, FOLIAGE:0.52 }),
  growthTicks: ticks(1.10),
  resourceNeeds: { water:0.019, sunlight:0.020, nutrients:0.009 },
  baseHue: { stem:116, leaf:124, flower:58, fruit:120 },
};

const CHILI_HABANERO: SpeciesDefinition = {
  id: 'chili_habanero', family: 'chili', variety: 'Habanero', displayName: 'Habanero',
  description: 'Small wrinkled fruits of extreme heat and stunning orange colour. Tropical, tough, rare.',
  basePhenotype: ph({ fruitSize:0.34, fruitCount:0.48, saturationBoost:0.88, waterEfficiency:0.62, hardiness:0.58 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ PIGMENT_A:0.62, WATER_USE:0.64, VIGOR:0.60, LIGHT_USE:0.55, HARDINESS:0.62 }),
  growthTicks: ticks(1.25),
  resourceNeeds: { water:0.016, sunlight:0.024, nutrients:0.007 },
  baseHue: { stem:115, leaf:122, flower:55, fruit:28 },
};

const CHILI_BELL: SpeciesDefinition = {
  id: 'chili_bell', family: 'chili', variety: 'Bell', displayName: 'Bell Pepper',
  description: 'Large blocky fruits with wild colour range — green, red, yellow, purple. Mild and sweet.',
  basePhenotype: ph({ fruitSize:0.78, fruitCount:0.35, heightFactor:0.42, saturationBoost:0.60 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ FRUIT_SIZE:0.75, PIGMENT_A:0.50, PIGMENT_B:0.38, FOLIAGE:0.56, YIELD:0.38 }),
  growthTicks: ticks(1.30),
  resourceNeeds: { water:0.026, sunlight:0.020, nutrients:0.012 },
  baseHue: { stem:116, leaf:124, flower:56, fruit:115 },
};

const CHILI_SERRANO: SpeciesDefinition = {
  id: 'chili_serrano', family: 'chili', variety: 'Serrano', displayName: 'Serrano',
  description: 'Small bullet-shaped peppers, bright red, prolific. Fast-growing and high-yielding.',
  basePhenotype: ph({ fruitSize:0.28, fruitCount:0.72, growthRate:0.64, heightFactor:0.40 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ VIGOR:0.70, YIELD:0.68, FRUIT_SIZE:0.25, PIGMENT_A:0.72, SEED_SET:0.62 }),
  growthTicks: ticks(0.85),
  resourceNeeds: { water:0.018, sunlight:0.020, nutrients:0.007 },
  baseHue: { stem:116, leaf:122, flower:56, fruit:15 },
};

// ─── BASIL FAMILY ─────────────────────────────

const BASIL_SWEET: SpeciesDefinition = {
  id: 'basil_sweet', family: 'basil', variety: 'Sweet', displayName: 'Sweet Basil',
  description: 'The classic culinary basil. Large bright leaves, fast growth, aromatic harvest.',
  basePhenotype: ph({ leafSize:0.68, leafCount:0.70, growthRate:0.74, heightFactor:0.32, branchDensity:0.58 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ FOLIAGE:0.72, VIGOR:0.68, STATURE:0.32, PIGMENT_A:0.60, WATER_USE:0.44 }),
  growthTicks: ticks(0.72),
  resourceNeeds: { water:0.030, sunlight:0.016, nutrients:0.010 },
  baseHue: { stem:118, leaf:126, flower:50, fruit:120 },
};

const BASIL_THAI: SpeciesDefinition = {
  id: 'basil_thai', family: 'basil', variety: 'Thai', displayName: 'Thai Basil',
  description: 'Smaller pointed leaves on purple stems. Distinctive anise-like aroma, visually striking.',
  basePhenotype: ph({ leafSize:0.52, leafCount:0.58, growthRate:0.66, secondaryColorShift:-0.40 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ FOLIAGE:0.60, VIGOR:0.62, PIGMENT_B:0.22, PIGMENT_A:0.55, STATURE:0.30 }),
  growthTicks: ticks(0.82),
  resourceNeeds: { water:0.026, sunlight:0.016, nutrients:0.010 },
  baseHue: { stem:280, leaf:140, flower:48, fruit:130 },
};

const BASIL_PURPLE: SpeciesDefinition = {
  id: 'basil_purple', family: 'basil', variety: 'Purple', displayName: 'Purple Basil',
  description: 'Deep burgundy-purple foliage. Dramatic colouring, rarer genetic expression, collector favourite.',
  basePhenotype: ph({ leafSize:0.55, leafCount:0.58, saturationBoost:0.78, secondaryColorShift:-0.70 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ PIGMENT_A:0.15, PIGMENT_B:0.16, FOLIAGE:0.60, VIGOR:0.55, STATURE:0.28 }),
  growthTicks: ticks(0.90),
  resourceNeeds: { water:0.028, sunlight:0.016, nutrients:0.011 },
  baseHue: { stem:290, leaf:292, flower:300, fruit:290 },
};

const BASIL_LEMON: SpeciesDefinition = {
  id: 'basil_lemon', family: 'basil', variety: 'Lemon', displayName: 'Lemon Basil',
  description: 'Pale yellow-green leaves with a citrus fragrance. Delicate but water-efficient.',
  basePhenotype: ph({ leafSize:0.45, leafCount:0.52, growthRate:0.68, waterEfficiency:0.58, saturationBoost:0.42 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ PIGMENT_A:0.22, FOLIAGE:0.58, WATER_USE:0.58, VIGOR:0.60, STATURE:0.28 }),
  growthTicks: ticks(0.78),
  resourceNeeds: { water:0.022, sunlight:0.016, nutrients:0.009 },
  baseHue: { stem:105, leaf:82, flower:52, fruit:88 },
};

const BASIL_HOLY: SpeciesDefinition = {
  id: 'basil_holy', family: 'basil', variety: 'Holy', displayName: 'Holy Basil',
  description: 'Sacred Tulsi basil — dark aromatic leaves, reddish stems. Hardy and spiritually significant.',
  basePhenotype: ph({ leafSize:0.50, leafCount:0.55, growthRate:0.60, hardiness:0.66, heightFactor:0.35 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ HARDINESS:0.68, VIGOR:0.60, PIGMENT_B:0.34, PIGMENT_A:0.52, WATER_USE:0.55 }),
  growthTicks: ticks(0.95),
  resourceNeeds: { water:0.022, sunlight:0.016, nutrients:0.009 },
  baseHue: { stem:310, leaf:132, flower:310, fruit:130 },
};

// ─── RADISH FAMILY ────────────────────────────

const RADISH_CHERRY: SpeciesDefinition = {
  id: 'radish_cherry', family: 'radish', variety: 'Cherry Belle', displayName: 'Cherry Belle Radish',
  description: 'Classic small round red radish. Fastest-growing plant in the game — almost instant gratification.',
  basePhenotype: ph({ fruitSize:0.42, fruitCount:0.45, growthRate:0.84, heightFactor:0.22, hardiness:0.60 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ VIGOR:0.72, STATURE:0.26, FRUIT_SIZE:0.45, PIGMENT_A:0.62, SEED_SET:0.65 }),
  growthTicks: ticks(0.50),
  resourceNeeds: { water:0.022, sunlight:0.014, nutrients:0.012 },
  baseHue: { stem:116, leaf:120, flower:300, fruit:355 },
};

const RADISH_DAIKON: SpeciesDefinition = {
  id: 'radish_daikon', family: 'radish', variety: 'Daikon', displayName: 'Daikon Radish',
  description: 'Enormous white root used across Asian cuisines. Slow-growing but produces an impressive harvest.',
  basePhenotype: ph({ fruitSize:0.82, fruitCount:0.25, growthRate:0.38, heightFactor:0.24, waterEfficiency:0.55 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ FRUIT_SIZE:0.78, STATURE:0.28, VIGOR:0.55, WATER_USE:0.58, YIELD:0.40 }),
  growthTicks: ticks(1.60),
  resourceNeeds: { water:0.025, sunlight:0.014, nutrients:0.015 },
  baseHue: { stem:116, leaf:120, flower:50, fruit:0 },
  fruitSaturationBase: 8,
  fruitLightnessBase:  82,
};

const RADISH_WATERMELON: SpeciesDefinition = {
  id: 'radish_watermelon', family: 'radish', variety: 'Watermelon', displayName: 'Watermelon Radish',
  description: 'Green outside, vivid magenta-pink inside. A visual surprise and collector trophy.',
  basePhenotype: ph({ fruitSize:0.58, fruitCount:0.38, saturationBoost:0.80, heightFactor:0.24 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ PIGMENT_A:0.30, FRUIT_SIZE:0.60, STATURE:0.28, VIGOR:0.58, PIGMENT_B:0.45 }),
  growthTicks: ticks(1.10),
  resourceNeeds: { water:0.023, sunlight:0.014, nutrients:0.013 },
  baseHue: { stem:116, leaf:120, flower:300, fruit:342 },
};

const RADISH_BLACK: SpeciesDefinition = {
  id: 'radish_black', family: 'radish', variety: 'Black', displayName: 'Black Radish',
  description: 'Dark exterior, stark white flesh. Mysterious, hardy, and surprisingly rare to breed well.',
  basePhenotype: ph({ fruitSize:0.55, fruitCount:0.35, hardiness:0.65, heightFactor:0.22 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ HARDINESS:0.66, PIGMENT_A:0.20, PIGMENT_B:0.22, FRUIT_SIZE:0.58, VIGOR:0.56 }),
  growthTicks: ticks(1.30),
  resourceNeeds: { water:0.020, sunlight:0.013, nutrients:0.011 },
  baseHue: { stem:116, leaf:120, flower:250, fruit:250 },
  fruitSaturationBase: 22,
  fruitLightnessBase:  18,
};

const RADISH_FRENCH: SpeciesDefinition = {
  id: 'radish_french', family: 'radish', variety: 'French Breakfast', displayName: 'French Breakfast Radish',
  description: 'Elongated red root with a white tip. Crisp, mild, and a pleasure to grow.',
  basePhenotype: ph({ fruitSize:0.38, fruitCount:0.55, growthRate:0.72, heightFactor:0.20 }),
  geneKeys: ALL_GENE_KEYS,
  alleleFrequencies: freqs({ VIGOR:0.65, STATURE:0.24, FRUIT_SIZE:0.40, PIGMENT_A:0.58, SEED_SET:0.60 }),
  growthTicks: ticks(0.65),
  resourceNeeds: { water:0.020, sunlight:0.013, nutrients:0.011 },
  baseHue: { stem:116, leaf:120, flower:300, fruit:355 },
};

// ─── Registry ─────────────────────────────────

export const SPECIES_REGISTRY: Record<SpeciesId, SpeciesDefinition> = {
  tomato_cherry:      TOMATO_CHERRY,
  tomato_beefsteak:   TOMATO_BEEFSTEAK,
  tomato_roma:        TOMATO_ROMA,
  tomato_heirloom:    TOMATO_HEIRLOOM,
  tomato_yellow_pear: TOMATO_YELLOW_PEAR,
  chili_cayenne:      CHILI_CAYENNE,
  chili_jalapeno:     CHILI_JALAPENO,
  chili_habanero:     CHILI_HABANERO,
  chili_bell:         CHILI_BELL,
  chili_serrano:      CHILI_SERRANO,
  basil_sweet:        BASIL_SWEET,
  basil_thai:         BASIL_THAI,
  basil_purple:       BASIL_PURPLE,
  basil_lemon:        BASIL_LEMON,
  basil_holy:         BASIL_HOLY,
  radish_cherry:      RADISH_CHERRY,
  radish_daikon:      RADISH_DAIKON,
  radish_watermelon:  RADISH_WATERMELON,
  radish_black:       RADISH_BLACK,
  radish_french:      RADISH_FRENCH,
};

export const ALL_SPECIES_IDS = Object.keys(SPECIES_REGISTRY) as SpeciesId[];

export const SPECIES_BY_FAMILY: Record<string, SpeciesId[]> = {
  tomato: ['tomato_cherry','tomato_beefsteak','tomato_roma','tomato_heirloom','tomato_yellow_pear'],
  chili:  ['chili_cayenne','chili_jalapeno','chili_habanero','chili_bell','chili_serrano'],
  basil:  ['basil_sweet','basil_thai','basil_purple','basil_lemon','basil_holy'],
  radish: ['radish_cherry','radish_daikon','radish_watermelon','radish_black','radish_french'],
};

export function getSpecies(id: string): SpeciesDefinition {
  const s = SPECIES_REGISTRY[id as SpeciesId];
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}
