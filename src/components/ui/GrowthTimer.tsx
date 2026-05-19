// ─────────────────────────────────────────────
// src/components/ui/GrowthTimer.tsx
// Stage progress bar + time-remaining estimate.
// Used in the plant detail modal and plot tooltips.
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import type { PlantInstance } from '../../types';
import {
  stageLabel,
  ticksRemainingInStage,
  formatTickDuration,
  getStageTickDuration,
  stageIndex,
  type SimulationEvent,
} from '../../simulation';
import { getSpecies } from '../../genetics/species';

type GrowthTimerProps = {
  plant:            PlantInstance;
  simulationSpeed?: number;
  compact?:         boolean;
};

// Colour per stage — matches badge palette but as raw strings
const STAGE_COLORS: Record<string, string> = {
  seed:          COLORS.soil_light,
  sprout:        COLORS.green_pale,
  vegetative:    COLORS.green_primary,
  flowering:     COLORS.terra_pale,
  mature:        COLORS.green_bright,
  harvest_ready: COLORS.text_accent,
  decaying:      COLORS.soil_light,
  dead:          COLORS.text_muted,
};

// Total lifecycle stages shown in the progress strip
const LIFECYCLE: PlantInstance['growthStage'][] = [
  'seed', 'sprout', 'vegetative', 'flowering',
  'mature', 'harvest_ready',
];

export function GrowthTimer({ plant, simulationSpeed = 1, compact = false }: GrowthTimerProps) {
  const stage    = plant.growthStage;
  const progress = plant.growthProgress;
  const color    = STAGE_COLORS[stage] ?? COLORS.green_primary;

  let species;
  try { species = getSpecies(plant.speciesId); }
  catch { return null; }

  const remaining = ticksRemainingInStage(plant, species);
  const timeStr   = remaining !== null
    ? formatTickDuration(remaining, simulationSpeed)
    : null;

  const currentIndex = stageIndex(stage as PlantInstance['growthStage']);

  if (compact) {
    // Compact: single bar + label, used in smaller contexts
    return (
      <View style={styles.compact}>
        <View style={styles.compactLabelRow}>
          <AppText variant="label" style={{ color }}>
            {stageLabel(stage as PlantInstance['growthStage'])}
          </AppText>
          {timeStr && (
            <AppText variant="mono" color="muted" style={styles.timeText}>
              {timeStr}
            </AppText>
          )}
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stage label + time remaining */}
      <View style={styles.headerRow}>
        <View style={styles.stagePill}>
          <View style={[styles.stageDot, { backgroundColor: color }]} />
          <AppText variant="label" style={{ color }}>
            {stageLabel(stage as PlantInstance['growthStage'])}
          </AppText>
        </View>
        {timeStr ? (
          <AppText variant="mono" color="muted" style={styles.timeText}>
            ~{timeStr} remaining
          </AppText>
        ) : stage === 'dead' ? (
          <AppText variant="label" color="muted">Plant died</AppText>
        ) : null}
      </View>

      {/* Current stage progress bar */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${progress * 100}%`, backgroundColor: color },
          ]}
        />
      </View>

      {/* Lifecycle strip — shows position in full lifecycle */}
      <View style={styles.lifecycleStrip}>
        {LIFECYCLE.map((s, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent   = i === currentIndex;
          const segColor    = STAGE_COLORS[s] ?? COLORS.green_primary;
          return (
            <View key={s} style={styles.lifecycleSegmentWrapper}>
              <View
                style={[
                  styles.lifecycleSegment,
                  isCompleted && { backgroundColor: segColor, opacity: 0.55 },
                  isCurrent   && { backgroundColor: segColor },
                  !isCompleted && !isCurrent && { backgroundColor: COLORS.bg_overlay },
                ]}
              />
              {isCurrent && (
                <View style={[styles.lifecycleDot, { backgroundColor: segColor }]} />
              )}
            </View>
          );
        })}
      </View>

      {/* Lifecycle stage labels */}
      <View style={styles.lifecycleLabels}>
        {LIFECYCLE.map((s) => (
          <AppText
            key={s}
            variant="label"
            style={[
              styles.lifecycleLabel,
              { color: s === stage ? STAGE_COLORS[s] : COLORS.text_muted },
            ]}
          >
            {stageLabel(s as PlantInstance['growthStage']).slice(0, 4)}
          </AppText>
        ))}
      </View>

      {/* Age */}
      <AppText variant="caption" color="muted" style={styles.age}>
        Age: {plant.age} ticks · Gen {plant.generation}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING['2'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
  },
  timeText: {
    fontSize: 10,
  },
  track: {
    height: 5,
    backgroundColor: COLORS.bg_overlay,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  lifecycleStrip: {
    flexDirection: 'row',
    gap: 3,
    marginTop: SPACING['1'],
  },
  lifecycleSegmentWrapper: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
  },
  lifecycleSegment: {
    height: 3,
    width: '100%',
    borderRadius: RADIUS.full,
  },
  lifecycleDot: {
    position: 'absolute',
    top: -2,
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
  },
  lifecycleLabels: {
    flexDirection: 'row',
    marginTop: SPACING['1'],
  },
  lifecycleLabel: {
    flex: 1,
    fontSize: 7,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  age: {
    marginTop: SPACING['1'],
  },
  // Compact variant
  compact: {
    gap: SPACING['1'],
  },
  compactLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
