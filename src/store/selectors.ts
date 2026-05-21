// ─────────────────────────────────────────────
// src/store/selectors.ts
// Phase 9 — Stable selector utilities.
//
// Re-exports stable selector hooks that are defined in
// index.ts (where AppStore type is fully resolved).
// This file exists purely as a named export alias so
// consumers can import from a dedicated path if preferred.
// ─────────────────────────────────────────────

export {
  usePlantsNeedingWaterStable,
  useHarvestReadyPlantsStable,
  useOccupiedPlotCountStable,
  useHarvestListStable,
  useTotalSeedCountStable,
  useSeedListStable,
} from './index';
