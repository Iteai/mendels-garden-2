// ─────────────────────────────────────────────
// src/simulation/simulationCore.ts
//
// Pure, side-effect-free plant lifecycle engine.
// Takes a PlantInstance + elapsed ticks → returns
// the updated PlantInstance.
//
// Performance contract:
//   - No object allocation inside the inner loop
//   - Single shallow clone per plant per batch
//   - Safe for 300 plants × 720 offline ticks
//
// Growth model:
//   growthProgress 0→1 within each stage
//   progress/tick  = (1/stageDuration) × growthRate × healthFactor × lightFactor
//   stageDuration  = species.growthTicks[stage] (modified by growthRate at
//                    the species level but not per-tick — avoids feedback loops)
//
// Resource model:
//   water/nutrients decay per tick based on stage and phenotype efficiency
//   light passively recovers toward plant's lightEfficiency ceiling
//   healthValue is a weighted blend recomputed each tick
// ─────────────────────────────────────────────

import type { PlantInstance, GrowthStage } from '../types';
import type { SpeciesDefinition } from '../genetics/species';
import { getSpecies } from '../genetics/species';

// ─── Stage ordering ───────────────────────────
// O(1) Map lookup instead of Array.indexOf for performance
// during batch simulation (called on every tick per plant).

const STAGE_ORDER: GrowthStage[] = [
  'seed', 'sprout', 'vegetative', 'flowering',
  'mature', 'harvest_ready', 'decaying', 'dead',
];

const STAGE_INDEX_MAP = new Map<GrowthStage, number>(
  STAGE_ORDER.map((s, i) => [s, i]),
);

const STAGE_NEXT_MAP = new Map<GrowthStage, GrowthStage>();
for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
  STAGE_NEXT_MAP.set(STAGE_ORDER[i], STAGE_ORDER[i + 1]);
}
STAGE_NEXT_MAP.set('dead', 'dead');

export function stageIndex(stage: GrowthStage): number {
  return STAGE_INDEX_MAP.get(stage) ?? -1;
}

export function nextGrowthStage(stage: GrowthStage): GrowthStage {
  return STAGE_NEXT_MAP.get(stage) ?? 'dead';
}

// ─── Stage durations ──────────────────────────
// How many simulation ticks each stage takes to complete.
// growthRate phenotype modifier is applied in progressPerTick,
// NOT here — keeping duration predictable for UI display.

export function getStageTickDuration(
  stage: GrowthStage,
  species: SpeciesDefinition,
): number {
  const g = species.growthTicks;
  switch (stage) {
    case 'seed':          return g.seedToSprout;
    case 'sprout':        return g.sproutToVegetative;
    case 'vegetative':    return g.vegetativeToFlowering;
    case 'flowering':     return g.floweringToMature;
    case 'mature':        return Math.round(g.matureToDecay * 0.55);
    case 'harvest_ready': return g.matureToDecay;
    case 'decaying':      return Math.round(g.matureToDecay * 0.60);
    case 'dead':          return Infinity;
  }
}

// ─── Resource multipliers per stage ──────────
// How much more/less water and nutrients a plant
// needs at each lifecycle stage.

const WATER_MULT: Record<GrowthStage, number> = {
  seed:          0.25,
  sprout:        0.55,
  vegetative:    1.20,
  flowering:     1.45,   // peak demand — flowering is thirsty
  mature:        1.10,
  harvest_ready: 0.75,
  decaying:      0.30,
  dead:          0.00,
};

const NUTRIENT_MULT: Record<GrowthStage, number> = {
  seed:          0.15,
  sprout:        0.40,
  vegetative:    1.10,
  flowering:     1.30,
  mature:        0.90,
  harvest_ready: 0.50,
  decaying:      0.15,
  dead:          0.00,
};

// ─── Health computation ───────────────────────

/**
 * Compute 0–1 health value from resource levels and phenotype.
 *
 * Weighting: water (42%) > light (30%) > nutrients (28%)
 * Hardiness adds a soft floor — tough plants stay healthier longer.
 */
export function computeHealthValue(
  water:     number,
  light:     number,
  nutrients: number,
  waterEfficiency: number,
  lightEfficiency: number,
  hardiness: number,
): number {
  // Apply efficiency traits: reduces sensitivity to low resources
  const effectiveWater     = Math.min(1, water     + waterEfficiency     * 0.18);
  const effectiveLight     = Math.min(1, light     + lightEfficiency     * 0.12);
  const effectiveNutrients = Math.min(1, nutrients + hardiness           * 0.10);

  const raw = effectiveWater * 0.42 + effectiveLight * 0.30 + effectiveNutrients * 0.28;

  // Hardiness floor: prevents instant health collapse
  const floor = hardiness * 0.12;
  return Math.min(1, Math.max(0, raw + floor * (1 - raw)));
}

export function healthValueToStatus(v: number): PlantInstance['health'] {
  if (v >= 0.78) return 'thriving';
  if (v >= 0.56) return 'healthy';
  if (v >= 0.36) return 'stressed';
  if (v >= 0.18) return 'wilting';
  return 'dying';
}

// ─── Progress per tick ────────────────────────

/**
 * How much growthProgress advances in one tick.
 * This is the knob that makes growthRate meaningful:
 * a 1.0 growthRate plant completes each stage in exactly
 * `stageDuration` ticks at full health and light.
 */
function progressPerTick(
  stage: GrowthStage,
  species: SpeciesDefinition,
  growthRate: number,
  healthValue: number,
  lightLevel: number,
): number {
  const duration = getStageTickDuration(stage, species);
  if (duration === Infinity || duration <= 0) return 0;

  // Base: 1 tick = 1/duration of stage progress at default traits
  const base = 1 / duration;

  // Health modifier: minimum 0.12 so dying plants still slowly advance
  const healthMult = Math.max(0.12, healthValue);

  // Light modifier: minimum 0.18 (ambient light floor)
  const lightMult = Math.max(0.18, lightLevel);

  return base * growthRate * healthMult * lightMult;
}

// ─── Simulation events ────────────────────────
// Collected during batch simulation for notifications.

export type SimulationEvent = {
  type:    'stage_transition' | 'harvest_ready' | 'plant_died' | 'water_critical' | 'nutrient_critical';
  plantId: string;
  stage?:  GrowthStage;
};

// ─── Inner tick ───────────────────────────────
// Mutates `p` in place for performance.
// Returns an event if a noteworthy change occurred.

function processSingleTick(
  p: PlantInstance,
  species: SpeciesDefinition,
  events: SimulationEvent[],
): void {
  if (p.growthStage === 'dead') return;

  const ph = p.phenotype;

  // ── 1. Resource decay ─────────────────────

  const waterDecay = species.resourceNeeds.water
    * (WATER_MULT[p.growthStage] ?? 1)
    * (1 - ph.waterEfficiency * 0.42);

  const nutrientDecay = species.resourceNeeds.nutrients
    * (NUTRIENT_MULT[p.growthStage] ?? 1)
    * (1 - ph.hardiness * 0.28);

  // Light passively converges to the plant's efficiency ceiling
  const lightCeiling = ph.lightEfficiency * 0.88 + 0.10;
  const lightDelta   = (lightCeiling - p.lightLevel) * 0.06;

  const prevWater = p.waterLevel;
  p.waterLevel    = Math.max(0, p.waterLevel    - waterDecay);
  p.nutrientLevel = Math.max(0, p.nutrientLevel - nutrientDecay);
  p.lightLevel    = Math.min(1, Math.max(0, p.lightLevel + lightDelta));

  // Water critical event (only fire once as it crosses threshold)
  if (prevWater >= 0.30 && p.waterLevel < 0.30) {
    events.push({ type: 'water_critical', plantId: p.id });
  }

  // ── 2. Health ─────────────────────────────

  const newHealth = computeHealthValue(
    p.waterLevel, p.lightLevel, p.nutrientLevel,
    ph.waterEfficiency, ph.lightEfficiency, ph.hardiness,
  );
  p.healthValue = newHealth;
  p.health      = healthValueToStatus(newHealth);

  // ── 3. Growth progress ────────────────────

  const delta = progressPerTick(
    p.growthStage, species,
    ph.growthRate, newHealth, p.lightLevel,
  );

  p.growthProgress = Math.min(1, p.growthProgress + delta);
  p.age            += 1;

  // ── 4. Stage transition ───────────────────

  if (p.growthProgress >= 1) {
    const oldStage   = p.growthStage;
    const newStage   = nextGrowthStage(oldStage);
    p.growthStage    = newStage;
    p.growthProgress = 0;

    if (newStage === 'harvest_ready') {
      events.push({ type: 'harvest_ready', plantId: p.id, stage: newStage });
    } else if (newStage === 'dead') {
      events.push({ type: 'plant_died', plantId: p.id, stage: newStage });
    } else {
      events.push({ type: 'stage_transition', plantId: p.id, stage: newStage });
    }
  }

  p.lastUpdatedAt = Date.now();
}

// ─── Public API ───────────────────────────────

export type AdvanceResult = {
  plant:  PlantInstance;
  events: SimulationEvent[];
};

/**
 * Advance a single plant by `ticks` simulation ticks.
 * Creates one shallow clone, then mutates it in the inner loop.
 * Returns the updated plant and any simulation events.
 */
export function advancePlant(
  plant:   PlantInstance,
  ticks:   number,
  species: SpeciesDefinition,
): AdvanceResult {
  const p: PlantInstance = { ...plant }; // single allocation
  const events: SimulationEvent[] = [];

  const safeTicks = Math.max(0, Math.floor(ticks));

  for (let t = 0; t < safeTicks; t++) {
    if (p.growthStage === 'dead') break;
    processSingleTick(p, species, events);
  }

  return { plant: p, events };
}

export type BatchResult = {
  plants:    Record<string, PlantInstance>;
  allEvents: SimulationEvent[];
};

/**
 * Advance all living plants in a garden by `ticks` ticks.
 * Returns fully updated plant map and aggregated events.
 *
 * Optimised for offline catch-up:
 *   300 plants × 720 ticks ≈ 216 000 iterations,
 *   each a handful of arithmetic ops — completes in < 80 ms.
 */
export function simulatePlants(
  plants: Record<string, PlantInstance>,
  ticks:  number,
): BatchResult {
  const updated: Record<string, PlantInstance> = {};
  const allEvents: SimulationEvent[] = [];

  for (const id in plants) {
    const plant = plants[id];

    // Skip dead plants — no further computation needed
    if (plant.growthStage === 'dead') {
      updated[id] = plant;
      continue;
    }

    let species: SpeciesDefinition;
    try {
      species = getSpecies(plant.speciesId);
    } catch {
      updated[id] = plant; // unknown species — skip
      continue;
    }

    const { plant: advanced, events } = advancePlant(plant, ticks, species);
    updated[id] = advanced;
    allEvents.push(...events);
  }

  return { plants: updated, allEvents };
}

// ─── Stage display helpers ────────────────────

/** Human-readable stage label */
export function stageLabel(stage: GrowthStage): string {
  const labels: Record<GrowthStage, string> = {
    seed:          'Seed',
    sprout:        'Sprout',
    vegetative:    'Growing',
    flowering:     'Flowering',
    mature:        'Maturing',
    harvest_ready: 'Ready',
    decaying:      'Decaying',
    dead:          'Dead',
  };
  return labels[stage] ?? stage;
}

/**
 * Estimated ticks remaining in current stage.
 * Returns null for dead plants.
 */
export function ticksRemainingInStage(
  plant:   PlantInstance,
  species: SpeciesDefinition,
): number | null {
  if (plant.growthStage === 'dead') return null;
  const duration = getStageTickDuration(plant.growthStage, species);
  if (duration === Infinity) return null;
  return Math.ceil((1 - plant.growthProgress) * duration);
}

/**
 * Human-readable time estimate for ticks.
 * Assumes 1 tick = 5 real seconds at 1× speed.
 */
export function formatTickDuration(ticks: number, speedMultiplier = 1): string {
  const realSeconds = (ticks / speedMultiplier) * 5;
  if (realSeconds < 60)  return `${Math.ceil(realSeconds)}s`;
  if (realSeconds < 3600) return `${Math.ceil(realSeconds / 60)}m`;
  return `${(realSeconds / 3600).toFixed(1)}h`;
}
