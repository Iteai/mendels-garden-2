// ─────────────────────────────────────────────
// src/components/plants/colorMapper.ts
// Phenotype + SpeciesDefinition → HSL palette
// Supports fruitSaturationBase / fruitLightnessBase
// overrides for unusual varieties (daikon, black radish)
// ─────────────────────────────────────────────

import type { Phenotype } from '../../types';
import type { SpeciesDefinition } from '../../genetics/species';
import type { PlantColorPalette } from './types';

function hsl(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(0, Math.min(100, s));
  const ll = Math.max(0, Math.min(100, l));
  return `hsl(${Math.round(hh)}, ${Math.round(ss)}%, ${Math.round(ll)}%)`;
}

export function computeColorPalette(
  phenotype:   Phenotype,
  species:     SpeciesDefinition,
  healthValue  = 1.0,
): PlantColorPalette {
  const bh = species.baseHue;

  const primaryShift   = phenotype.primaryColorShift   * 60;
  const secondaryShift = phenotype.secondaryColorShift * 20;
  const satExtra       = phenotype.saturationBoost     * 35;
  const healthFactor   = 0.35 + healthValue * 0.65;

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
  // Per-species overrides for unusual varieties
  const fruitH  = bh.fruit + primaryShift;
  const fruitSB = species.fruitSaturationBase ?? 52;
  const fruitLB = species.fruitLightnessBase  ?? 44;
  const fruitS  = (fruitSB + satExtra) * healthFactor;
  const fruit          = hsl(fruitH, fruitS, fruitLB);
  const fruitDark      = hsl(fruitH - 4, fruitS * 0.8, Math.max(8, fruitLB - 14));
  const fruitHighlight = hsl(fruitH + 12, fruitS * 0.45, Math.min(92, fruitLB + 28));
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
