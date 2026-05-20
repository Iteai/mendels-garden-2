// ─────────────────────────────────────────────
// src/components/plants/PlantRenderer.tsx
// Top-level renderer — routes to species component.
// Memoised to avoid re-renders on every sim tick.
// ─────────────────────────────────────────────

import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { PlantInstance, Phenotype, GrowthStage, SpeciesId } from '../../types';
import { buildPlantGeometry } from './geometryEngine';
import { TomatoPlant }  from './TomatoPlant';
import { ChiliPlant }   from './ChiliPlant';
import { BasilPlant }   from './BasilPlant';
import { RadishPlant }  from './RadishPlant';
import { getSpecies }   from '../../genetics/species';
import type { PlantGeometry } from './types';

// ─── Props ────────────────────────────────────

type PlantRendererProps = {
  plant?:      PlantInstance;          // Option A
  speciesId?:  SpeciesId;             // Option B (raw values)
  phenotype?:  Phenotype;
  stage?:      GrowthStage;
  health?:     number;
  width:       number;
  height:      number;
};

// ─── Species router ───────────────────────────

function renderSpecies(
  speciesId: SpeciesId,
  geometry:  PlantGeometry,
  width:     number,
  height:    number,
) {
  switch (speciesId) {
    case 'chili':  return <ChiliPlant  geometry={geometry} width={width} height={height} />;
    case 'basil':  return <BasilPlant  geometry={geometry} width={width} height={height} />;
    case 'radish': return <RadishPlant geometry={geometry} width={width} height={height} />;
    default:       return <TomatoPlant geometry={geometry} width={width} height={height} />;
  }
}

// ─── Empty placeholder ────────────────────────

function EmptyPlant({ width, height }: { width: number; height: number }) {
  return <View style={[styles.empty, { width, height }]} />;
}

// ─── Inner component ──────────────────────────

function PlantRendererInner({
  plant,
  speciesId: rawSpeciesId,
  phenotype: rawPhenotype,
  stage:     rawStage,
  health:    rawHealth,
  width,
  height,
}: PlantRendererProps) {
  const resolvedSpeciesId = plant?.speciesId  ?? rawSpeciesId  ?? 'tomato';
  const resolvedPhenotype = plant?.phenotype  ?? rawPhenotype;
  const resolvedStage     = plant?.growthStage ?? rawStage     ?? 'seed';
  const resolvedHealth    = plant?.healthValue ?? rawHealth     ?? 1.0;

  // Health bucketed to 5 tiers — prevents re-renders on every tick
  const healthBucket = Math.round(resolvedHealth * 4);

  const geometry = useMemo(() => {
    if (!resolvedPhenotype) return null;
    try {
      const species = getSpecies(resolvedSpeciesId);
      return buildPlantGeometry(resolvedPhenotype, resolvedStage, species, resolvedHealth);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSpeciesId, resolvedPhenotype, resolvedStage, healthBucket]);

  if (!geometry) return <EmptyPlant width={width} height={height} />;

  return renderSpecies(resolvedSpeciesId as SpeciesId, geometry, width, height);
}

// ─── Memoised export ──────────────────────────

export const PlantRenderer = memo(PlantRendererInner, (prev, next) => {
  if (prev.width !== next.width || prev.height !== next.height) return false;
  if (!!prev.plant !== !!next.plant) return false;

  if (prev.plant && next.plant) {
    return (
      prev.plant.id          === next.plant.id &&
      prev.plant.growthStage === next.plant.growthStage &&
      Math.round(prev.plant.healthValue * 4) === Math.round(next.plant.healthValue * 4)
    );
  }

  return (
    prev.speciesId === next.speciesId &&
    prev.stage     === next.stage     &&
    prev.phenotype === next.phenotype &&
    Math.round((prev.health ?? 1) * 4) === Math.round((next.health ?? 1) * 4)
  );
});

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  empty: { backgroundColor: 'transparent' },
});
