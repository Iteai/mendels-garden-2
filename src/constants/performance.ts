// ─────────────────────────────────────────────
// src/constants/performance.ts
// Performance configuration — mobile-friendly defaults
// Phase 9: Performance optimization
// ─────────────────────────────────────────────

import { Platform } from 'react-native';

export type QualityTier = 'low' | 'medium' | 'high';

/**
 * Detect device performance tier.
 * Android low-end: API level < 28 or limited RAM
 * We use a simple heuristic based on Platform constants.
 * More sophisticated detection could use MemoryInfo API.
 */
export function detectQualityTier(): QualityTier {
  if (Platform.OS === 'android') {
    // Android low-end flag
    // This is conservative — most Android devices are mid-range+
    return 'medium';
  }
  return 'high';
}

/** Current quality tier — set at app init */
export const QUALITY_TIER: QualityTier = detectQualityTier();

// ─── SVG Rendering ────────────────────────────

/**
 * Maximum SVG elements rendered per plant.
 * When plant complexity exceeds this, elements are culled.
 */
export const SVG_ELEMENT_LIMITS: Record<QualityTier, {
  maxLeaves: number;
  maxBranches: number;
  maxFlowers: number;
  maxFruits: number;
  detailMultiplier: number; // 0–1 scale on geometry detail
}> = {
  low:    { maxLeaves: 6,  maxBranches: 4,  maxFlowers: 2,  maxFruits: 3,  detailMultiplier: 0.6 },
  medium: { maxLeaves: 12, maxBranches: 8,  maxFlowers: 3,  maxFruits: 5,  detailMultiplier: 0.8 },
  high:   { maxLeaves: 20, maxBranches: 10, maxFlowers: 5,  maxFruits: 8,  detailMultiplier: 1.0 },
};

export const SVG_LIMITS = SVG_ELEMENT_LIMITS[QUALITY_TIER];

// ─── Simulation ───────────────────────────────

/** Maximum plants to simulate in a single batch (prevents UI hang) */
export const MAX_SIMULATION_BATCH = 300;

/** Throttle interval for simulation updates (ms between batches) */
export const SIMULATION_BATCH_INTERVAL = 50;

// ─── Rendering ────────────────────────────────

/**
 * How many SVG elements to batch together in a single <G> group.
 * Higher = fewer groups but potentially larger single operations.
 */
export const SVG_BATCH_SIZE = 5;

// ─── Memory ───────────────────────────────────

/** Maximum seeds in inventory before oldest are auto-removed */
export const MAX_SEEDS_CACHE = 200;

/** Maximum harvest records kept */
export const MAX_HARVEST_CACHE = 100;