// ─────────────────────────────────────────────
// src/components/plants/PlantRenderer.tsx
//
// Top-level plant rendering component.
// Accepts a PlantInstance (or raw Phenotype + stage)
// and routes to the correct species renderer.
//
// Memoised: re-renders only when plantId, stage,
// or health change — not on every simulation tick.
// ─────────────────────────────────────────────

import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { PlantInstance, Phenotype, GrowthStage, SpeciesId } from '../../types';
import { buildPlantGeometry } from './geometryEngine';
import { TomatoPlant }        from './TomatoPlant';
import { getSpecies }          from '../../genetics/species';

// ─── Props ────────────────────────────────────

type PlantRendererProps = {
  // Option A: pass a full PlantInstance
  plant?: PlantInstance;

  // Option B: pass raw values (e.g. for previews)
  speciesId?:  SpeciesId;
  phenotype?:  Phenotype;
  stage?:      GrowthStage;
  health?:     number;

  width:  number;
  height: number;
};

// ─── Species router ───────────────────────────
// Each species will eventually have its own renderer.
// Chili/Basil/Radish inherit TomatoPlant with their
// own color palette until Phase 6 adds unique shapes.

function renderSpecies(
  speciesId: SpeciesId,
  geometry: ReturnType<typeof buildPlantGeometry>,
  width: number,
  height: number,
) {
  // All species use TomatoPlant geometry for now.
  // Phase 6 adds ChiliPlant, BasilPlant, RadishPlant.
  return <TomatoPlant geometry={geometry} width={width} height={height} />;
}

// ─── Placeholder for unknown states ──────────

function EmptyPlant({ width, height }: { width: number; height: number }) {
  return <View style={[styles.empty, { width, height }]} />;
}

// ─── Main component ───────────────────────────

function PlantRendererInner({
  plant,
  speciesId: rawSpeciesId,
  phenotype: rawPhenotype,
  stage:     rawStage,
  health:    rawHealth,
  width,
  height,
}: PlantRendererProps) {

  // Resolve props from either source
  const resolvedSpeciesId  = plant?.speciesId  ?? rawSpeciesId  ?? 'tomato';
  const resolvedPhenotype  = plant?.phenotype  ?? rawPhenotype;
  const resolvedStage      = plant?.growthStage ?? rawStage     ?? 'seed';
  const resolvedHealth     = plant?.healthValue ?? rawHealth     ?? 1.0;

  const geometry = useMemo(() => {
    if (!resolvedPhenotype) return null;
    try {
      const species = getSpecies(resolvedSpeciesId);
      return buildPlantGeometry(
        resolvedPhenotype,
        resolvedStage,
        species,
        resolvedHealth,
      );
    } catch {
      return null;
    }
  }, [
    resolvedSpeciesId,
    resolvedPhenotype,
    resolvedStage,
    // Health bucketed to 5 levels to reduce re-renders
    Math.round(resolvedHealth * 4),
  ]);

  if (!geometry) return <EmptyPlant width={width} height={height} />;

  return renderSpecies(resolvedSpeciesId, geometry, width, height);
}

/**
 * Deep key comparison for phenotype objects.
 * Only checks phenotype traits that affect rendering (not computed fields).
 */
function shallowPhenotypeEqual(a: Phenotype | undefined, b: Phenotype | undefined): boolean {
  if (!a || !b) return a === b;
  return (
    a.heightFactor        === b.heightFactor        &&
    a.stemThickness       === b.stemThickness       &&
    a.leafSize            === b.leafSize            &&
    a.leafCount           === b.leafCount           &&
    a.branchDensity       === b.branchDensity       &&
    a.flowerSize          === b.flowerSize          &&
    a.fruitSize           === b.fruitSize           &&
    a.fruitCount          === b.fruitCount          &&
    a.primaryColorShift   === b.primaryColorShift   &&
    a.secondaryColorShift === b.secondaryColorShift &&
    a.saturationBoost     === b.saturationBoost
  );
}

// Memoised: value comparison on traits that affect visuals
export const PlantRenderer = memo(PlantRendererInner, (prev, next) => {
  // Re-render if size changed
  if (prev.width !== next.width || prev.height !== next.height) return false;

  // Re-render if switching between plant/raw props
  if (!!prev.plant !== !!next.plant) return false;

  if (prev.plant && next.plant) {
    // Plant-based: compare meaningful state changes using deep value comparison
    return (
      prev.plant.id           === next.plant.id           &&
      prev.plant.growthStage  === next.plant.growthStage  &&
      // Health bucket: re-render only when crossing a health tier
      Math.round(prev.plant.healthValue * 4) === Math.round(next.plant.healthValue * 4) &&
      // Compare visual phenotype traits by value, not reference
      prev.plant.phenotype.rarityScore === next.plant.phenotype.rarityScore &&
      shallowPhenotypeEqual(prev.plant.phenotype, next.plant.phenotype)
    );
  }

  // Raw-props: compare by value
  if (!prev.phenotype || !next.phenotype) return prev.phenotype === next.phenotype;
  return (
    prev.speciesId  === next.speciesId  &&
    prev.stage      === next.stage      &&
    Math.round((prev.health ?? 1) * 4) === Math.round((next.health ?? 1) * 4) &&
    shallowPhenotypeEqual(prev.phenotype, next.phenotype)
  );
});

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  empty: {
    backgroundColor: 'transparent',
  },
});
