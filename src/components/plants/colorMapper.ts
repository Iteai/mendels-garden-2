// ─────────────────────────────────────────────
// src/components/plants/colorMapper.ts
//
// Maps Phenotype traits to a full HSL color palette.
//
// Color model:
//   primaryColorShift  (-1..1) → ±60° rotation on fruit/flower hue
//   secondaryColorShift(-1..1) → ±20° rotation on leaf/stem hue
//   saturationBoost    (0..1)  → +0..40% saturation across all hues
//   healthValue        (0..1)  → dims saturation when plant is stressed
// ─────────────────────────────────────────────

import type { Phenotype } from '../../types';
import type { SpeciesDefinition } from '../../genetics/species';
import type { PlantColorPalette } from './types';

/** Build a CSS HSL string, clamping all values to valid ranges */
function hsl(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(0, Math.min(100, s));
  const ll = Math.max(0, Math.min(100, l));
  return `hsl(${Math.round(hh)}, ${Math.round(ss)}%, ${Math.round(ll)}%)`;
}

export function computeColorPalette(
  phenotype: Phenotype,
  species: SpeciesDefinition,
  healthValue = 1.0,
): PlantColorPalette {
  const bh = species.baseHue;

  // Trait-driven hue shifts
  const primaryShift   = phenotype.primaryColorShift * 60;   // ±60°
  const secondaryShift = phenotype.secondaryColorShift * 20; // ±20°

  // Saturation base + boost
  const satExtra = phenotype.saturationBoost * 35;

  // Health dims everything toward grey — stressed plants look washed out
  const healthFactor = 0.35 + healthValue * 0.65;

  // ── Stem ──────────────────────────────────────
  const stemH = bh.stem + secondaryShift;
  const stemS = (40 + satExtra) * healthFactor;
  const stem     = hsl(stemH, stemS, 28);
  const stemDark = hsl(stemH, stemS * 0.75, 18);

  // ── Leaf ──────────────────────────────────────
  const leafH = bh.leaf + secondaryShift;
  const leafS = (45 + satExtra) * healthFactor;
  const leaf     = hsl(leafH, leafS, 34);
  const leafDark = hsl(leafH, leafS * 0.7, 22);
  const leafVein = hsl(leafH - 5, leafS * 0.45, 48);

  // ── Flower ────────────────────────────────────
  const flowerH = bh.flower + primaryShift * 0.6;
  const flowerS = (55 + satExtra) * healthFactor;
  const flower       = hsl(flowerH, flowerS, 72);
  const flowerCenter = hsl(flowerH + 18, Math.min(100, flowerS * 1.3), 54);

  // ── Fruit ─────────────────────────────────────
  const fruitH = bh.fruit + primaryShift;
  const fruitS = (52 + satExtra) * healthFactor;
  const fruit          = hsl(fruitH, fruitS, 44);
  const fruitDark      = hsl(fruitH - 4, fruitS * 0.8, 28);
  const fruitHighlight = hsl(fruitH + 12, fruitS * 0.45, 72);
  const fruitStem      = hsl(stemH, stemS * 0.8, 24);

  // ── Seed ──────────────────────────────────────
  const seed = hsl(30, 35 * healthFactor, 32);

  return {
    stem, stemDark,
    leaf, leafDark, leafVein,
    flower, flowerCenter,
    fruit, fruitDark, fruitHighlight, fruitStem,
    seed,
  };
}
