// ─────────────────────────────────────────────
// src/components/plants/TomatoPlant.tsx
//
// Full Tomato SVG assembly.
// Composes Stem, LeafSet, FlowerSet, FruitSet
// based on PlantGeometry computed by geometryEngine.
//
// Render order (back → front):
//   1. Soil crumbs (seed/sprout)
//   2. Fruits (behind leaves when small)
//   3. Stem + branches
//   4. Leaves
//   5. Flowers (on top of leaves)
//   6. Harvest-ready glow ring
// ─────────────────────────────────────────────

import React from 'react';
import { Svg, G, Ellipse, Circle, Line, Path } from 'react-native-svg';
import { Stem }      from './parts/Stem';
import { LeafSet }   from './parts/Leaf';
import { FlowerSet } from './parts/Flower';
import { FruitSet }  from './parts/Fruit';
import type { PlantGeometry } from './types';

// ─── Soil Layer ───────────────────────────────
// Visible for seed and sprout stages only.

function SoilLayer({ cx, baseY, palette }: {
  cx: number; baseY: number; palette: PlantGeometry['palette'];
}) {
  return (
    <G>
      {/* Soil mound */}
      <Ellipse
        cx={cx}
        cy={baseY}
        rx={18}
        ry={4}
        fill={palette.stemDark}
        opacity={0.35}
      />
      {/* Soil texture dots */}
      {[[-6, -1], [4, 1], [-1, 0], [8, -1], [-10, 1]].map(([dx, dy], i) => (
        <Circle
          key={i}
          cx={cx + dx}
          cy={baseY + dy}
          r={0.9}
          fill={palette.stemDark}
          opacity={0.4}
        />
      ))}
    </G>
  );
}

// ─── Seed shape ───────────────────────────────

function SeedShape({ geom }: { geom: NonNullable<PlantGeometry['seedEllipse']>; palette: PlantGeometry['palette'] }) {
  return (
    <G>
      {/* Seed body */}
      <Ellipse
        cx={geom.cx}
        cy={geom.cy}
        rx={geom.rx}
        ry={geom.ry}
        fill="hsl(30, 38%, 28%)"
        transform={`rotate(${geom.rotation}, ${geom.cx}, ${geom.cy})`}
      />
      {/* Seed seam line */}
      <Line
        x1={geom.cx - geom.rx * 0.6}
        y1={geom.cy}
        x2={geom.cx + geom.rx * 0.6}
        y2={geom.cy}
        stroke="hsl(30, 25%, 40%)"
        strokeWidth={0.6}
        strokeLinecap="round"
        transform={`rotate(${geom.rotation}, ${geom.cx}, ${geom.cy})`}
        opacity={0.6}
      />
      {/* Seed highlight */}
      <Ellipse
        cx={geom.cx - geom.rx * 0.25}
        cy={geom.cy - geom.ry * 0.25}
        rx={geom.rx * 0.3}
        ry={geom.ry * 0.3}
        fill="hsl(35, 30%, 50%)"
        transform={`rotate(${geom.rotation}, ${geom.cx}, ${geom.cy})`}
        opacity={0.45}
      />
    </G>
  );
}

// ─── Sprout cotyledons ────────────────────────
// Round seed-leaves, different from true leaves

function Cotyledons({ geom, palette }: {
  geom: NonNullable<PlantGeometry['cotyledons']>;
  palette: PlantGeometry['palette'];
}) {
  return (
    <>
      {geom.map((leaf, i) => {
        // Cotyledons are rounder than true leaves — use an ellipse
        const L = leaf.length * 0.8;
        const W = leaf.width * 1.1;
        const path = [
          `M 0 0`,
          `C ${(L*0.2).toFixed(1)} ${(-W*0.7).toFixed(1)},`,
          `  ${(L*0.55).toFixed(1)} ${(-W*0.75).toFixed(1)},`,
          `  ${L.toFixed(1)} 0`,
          `C ${(L*0.55).toFixed(1)} ${(W*0.75).toFixed(1)},`,
          `  ${(L*0.2).toFixed(1)} ${(W*0.7).toFixed(1)},`,
          `0 0 Z`,
        ].join(' ');
        return (
          <G
            key={i}
            transform={`translate(${leaf.base.x.toFixed(1)}, ${leaf.base.y.toFixed(1)}) rotate(${leaf.rotation})`}
          >
            <Path
              d={path}
              fill={palette.leaf}
              stroke={palette.leafDark}
              strokeWidth={0.4}
              opacity={0.85}
            />
          </G>
        );
      })}
    </>
  );
}

// ─── Harvest glow ring ────────────────────────

function HarvestGlow({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="hsl(65, 90%, 60%)"
        strokeWidth={1.5}
        opacity={0.40}
      />
      <Circle
        cx={cx}
        cy={cy}
        r={r + 3}
        fill="none"
        stroke="hsl(65, 85%, 55%)"
        strokeWidth={0.7}
        opacity={0.20}
      />
    </>
  );
}

// ─── Main component ───────────────────────────

type TomatoPlantProps = {
  geometry: PlantGeometry;
  width: number;
  height: number;
};

export function TomatoPlant({ geometry: g, width, height }: TomatoPlantProps) {
  const isHarvestReady = g.stage === 'harvest_ready';
  const showSoil       = g.stage === 'seed' || g.stage === 'sprout';
  const showStem       = !!g.stem && g.stage !== 'seed';
  const showLeaves     = g.leaves.length > 0;
  const showFruits     = g.fruits.length > 0;
  const showFlowers    = g.flowers.length > 0;
  const showCotyledons = !!g.cotyledons && g.stage === 'sprout';

  // Approximate bounding centre for harvest glow
  const glowCY = g.stem ? g.stem.apex.y + (g.baseY - g.stem.apex.y) * 0.5 : g.baseY - 30;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${g.viewBoxW} ${g.viewBoxH}`}
      preserveAspectRatio="xMidYMax meet"
    >
      <G opacity={g.opacity}>

        {/* ── Soil (seed / sprout) ── */}
        {showSoil && (
          <SoilLayer cx={g.cx} baseY={g.baseY} palette={g.palette} />
        )}

        {/* ── Seed shape ── */}
        {g.seedEllipse && (
          <SeedShape geom={g.seedEllipse} palette={g.palette} />
        )}

        {/* ── Fruits (rendered before stem so stem sits on top) ── */}
        {showFruits && (
          <FruitSet
            fruits={g.fruits}
            palette={g.palette}
            harvestReady={isHarvestReady}
          />
        )}

        {/* ── Stem + branches ── */}
        {showStem && g.stem && (
          <Stem
            stem={g.stem}
            branches={g.branches}
            palette={g.palette}
          />
        )}

        {/* ── Cotyledons (sprout) ── */}
        {showCotyledons && g.cotyledons && (
          <Cotyledons geom={g.cotyledons} palette={g.palette} />
        )}

        {/* ── True leaves ── */}
        {showLeaves && (
          <LeafSet leaves={g.leaves} palette={g.palette} />
        )}

        {/* ── Flowers ── */}
        {showFlowers && (
          <FlowerSet
            flowers={g.flowers}
            palette={g.palette}
            opacity={g.stage === 'decaying' ? 0.4 : 0.95}
          />
        )}

        {/* ── Harvest-ready glow ── */}
        {isHarvestReady && (
          <HarvestGlow cx={g.cx} cy={glowCY} r={28} />
        )}

      </G>
    </Svg>
  );
}
