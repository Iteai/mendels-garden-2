// ─────────────────────────────────────────────
// src/genetics/index.ts
// Public API for the genetics module
// ─────────────────────────────────────────────

// Gene pool
export {
  GENE_POOL,
  GENE_REGISTRY,
  ALL_GENE_KEYS,
  GENE_COUNT,
  getTraitRange,
  PHENOTYPE_RANGES,
  type PhenotypeEffects,
  type GeneDelta,
  type GeneDefinition,
  type RareExpression,
} from './genes';

// Species
export {
  SPECIES_REGISTRY,
  ALL_SPECIES_IDS,
  getSpecies,
} from './species';

// Genotype engine
export {
  resolveExpression,
  dominantMultiplier,
  recessiveMultiplier,
  createWildTypeGenotype,
  createDominantGenotype,
  computePhenotype,
  getRarityBreakdown,
  applyMutation,
  describeGenotype,
  type AlleleExpression,
  type RarityBreakdown,
} from './genotype';

// Hybridiser
export {
  crossGenotypes,
  breedSeeds,
  createWildSeed,
  generateStarterSeeds,
  previewBreed,
  type BreedParams,
  type BreedResult,
  type CrossResult,
  type PhenotypePreview,
} from './hybridiser';

// Rarity
export {
  computeRarityLabel,
  type RarityLabel,
} from './rarity';

// Varieties
export {
  VARIETY_REGISTRY,
  getVarietiesForSpecies,
  getVariety,
  ALL_VARIETY_IDS,
  generateVarietySeed,
  type VarietyDefinition,
} from './varieties';