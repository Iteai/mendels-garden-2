// ─────────────────────────────────────────────
// src/simulation/index.ts
// Public API for the simulation module
// ─────────────────────────────────────────────

export {
  // Stage utilities
  stageIndex,
  nextGrowthStage,
  getStageTickDuration,
  stageLabel,
  ticksRemainingInStage,
  formatTickDuration,

  // Health
  computeHealthValue,
  healthValueToStatus,

  // Core advancement
  advancePlant,
  simulatePlants,
  simulatePlantsChunked,   // Phase 9: async chunked variant

  // Types
  type SimulationEvent,
  type AdvanceResult,
  type BatchResult,
  type ChunkedBatchResult, // Phase 9
} from './simulationCore';
