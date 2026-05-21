// ─────────────────────────────────────────────
// src/game/index.ts
// Public API for the game module
// ─────────────────────────────────────────────

export {
  // Calculations
  calculateHarvest,
  calculateCompostReward,
  validatePlanting,
  validateBreed,
  rarityFromScore,
  canHarvest,
  canCompost,
  shouldWater,
  shouldFeed,
  plantingErrorMessage,
  breedValidationMessage,
  BREED_COST,
  RARITY_SPORE_MULTIPLIER,

  // Types
  type YieldResult,
  type PlantingValidation,
  type BreedValidation,
  type PlantingError,
  isCrossFamily,
} from './gameLoop';

export {
  // Compound actions
  plantFromInventory,
  harvestPlant,
  compostPlant,
  breedFromInventory,
  useGameActions,

  // Types
  type PlantResult,
  type HarvestSummary,
  type CompostResult,
  type BreedResult,
} from './gameActions';
