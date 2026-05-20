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

  // Types
  type SimulationEvent,
  type AdvanceResult,
  type BatchResult,
} from './simulationCore';

export {
  initNotifications,
  scheduleHarvestReadyNotification,
  scheduleWaterCriticalNotification,
  schedulePlantDiedNotification,
  cancelPlantNotifications,
  getPendingNotificationCount,
} from './notifications';
