// ─────────────────────────────────────────────
// src/components/plants/TomatoPlant.tsx
//
// Premium plant SVG assembly.
// Composes Stem, LeafSet, FlowerSet, FruitSet
// based on PlantGeometry computed by geometryEngine.
// Enhanced with premium visual effects.
//
// Render order (back → front):
//   1. Atmospheric depth layer
//   2. Soil layer with depth and texture (seed/sprout)
//   3. Fruits (behind leaves when small)
//   4. Stem + branches with gradients
//   5. Leaves with veins and shading
//   6. Flowers (on top of leaves)
//   7. Harvest-ready glow aura
//   8. Atmospheric edge highlight
// ─────────────────────────────────────────────

import React from 'react';
import { Defs, Svg, G, Ellipse, Circle, Line, Path, RadialGradient, Stop } from 'react-native-svg';
import { Stem }      from './parts/Stem';
import { LeafSet }   from './parts/Leaf';
import { FlowerSet } from './parts/Flower';
import { FruitSet }  from './parts/Fruit';
import type { PlantGeometry } from './types';

// ─── Soil Layer ───────────────────────────────
// Enhanced with depth, shadow, and realistic texture

function SoilLayer({ cx, baseY, palette }: {
  cx: number; baseY: number; palette: PlantGeometry['palette'];
}) {
  const soilGradId = 'soilGrad';
  
  return (
    <G>
      <Defs>
        {/* Soil gradient for depth */}
        <RadialGradient
          id={soilGradId}
          cx="50%"
          cy="30%"
          r="60%"
        >
          <Stop offset="0%" stopColor={palette.stemDark} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={palette.stemDark} stopOpacity="0.15" />
        </RadialGradient>
      </Defs>

      {/* Soil mound shadow */}
      <Ellipse
        cx={cx}
        cy={baseY + 0.5}
        rx={20}
        ry={5}
        fill={palette.stemDark}
        opacity={0.2}
      />

      {/* Soil mound main */}
      <Ellipse
        cx={cx}
        cy={baseY}
        rx={18}
        ry={4.5}
        fill={`url(#${soilGradId})`}
        opacity={0.45}
      />

      {/* Soil texture — top edge highlight */}
      <Ellipse
        cx={cx}
        cy={baseY - 1.2}
        rx={16}
        ry={1.5}
        fill={palette.stemDark}
        opacity={0.15}
      />

      {/* Soil crumbs — multiple layers for realism */}
      {[
        { dx: -8, dy: -0.5, r: 1.2 },
        { dx: 5, dy: 0.8, r: 0.9 },
        { dx: -2, dy: 0.2, r: 0.7 },
        { dx: 10, dy: -0.8, r: 0.8 },
        { dx: -12, dy: 0.5, r: 0.6 },
        { dx: 2, dy: -1, r: 0.85 },
      ].map((crumb, i) => (
        <G key={i}>
          {/* Crumb shadow */}
          <Circle
            cx={cx + crumb.dx + 0.15}
            cy={baseY + crumb.dy + 0.2}
            r={crumb.r}
            fill={palette.stemDark}
            opacity={0.15}
          />
          {/* Crumb main */}
          <Circle
            cx={cx + crumb.dx}
            cy={baseY + crumb.dy}
            r={crumb.r}
            fill={palette.stemDark}
            opacity={0.4}
          />
        </G>
      ))}
    </G>
  );
}

// ─── Enhanced Seed Shape ───────────────────────
// Premium botanical seed with texture and highlights

function SeedShape({ geom, palette }: { geom: NonNullable<PlantGeometry['seedEllipse']>; palette: PlantGeometry['palette'] }) {
  const seedGradId = 'seedGrad';
  
  return (
    <G>
      <Defs>
        {/* Seed gradient for volume */}
        <RadialGradient
          id={seedGradId}
          cx="40%"
          cy="40%"
          r="60%"
        >
          <Stop offset="0%" stopColor="hsl(35, 35%, 45%)" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="hsl(30, 38%, 25%)" stopOpacity="1" />
        </RadialGradient>
      </Defs>

      {/* Seed shadow */}
      <Ellipse
        cx={geom.cx + 0.2}
        cy={geom.cy + 0.2}
        rx={geom.rx}
        ry={geom.ry}
        fill="hsl(30, 35%, 15%)"
        transform={`rotate(${geom.rotation}, ${geom.cx}, ${geom.cy})`}
        opacity={0.25}
      />

      {/* Seed body */}
      <Ellipse
        cx={geom.cx}
        cy={geom.cy}
        rx={geom.rx}
        ry={geom.ry}
        fill={`url(#${seedGradId})`}
        transform={`rotate(${geom.rotation}, ${geom.cx}, ${geom.cy})`}
      />

      {/* Seed seam line (botanical detail) */}
      <Line
        x1={geom.cx - geom.rx * 0.65}
        y1={geom.cy}
        x2={geom.cx + geom.rx * 0.65}
        y2={geom.cy}
        stroke="hsl(30, 25%, 35%)"
        strokeWidth={0.65}
        strokeLinecap="round"
        transform={`rotate(${geom.rotation}, ${geom.cx}, ${geom.cy})`}
        opacity={0.7}
      />

      {/* Seed highlight — wet look */}
      <Ellipse
        cx={geom.cx - geom.rx * 0.28}
        cy={geom.cy - geom.ry * 0.28}
        rx={geom.rx * 0.32}
        ry={geom.ry * 0.32}
        fill="hsl(38, 40%, 55%)"
        transform={`rotate(${geom.rotation}, ${geom.cx}, ${geom.cy})`}
        opacity={0.55}
      />

      {/* Secondary highlight for dimension */}
      <Ellipse
        cx={geom.cx + geom.rx * 0.15}
        cy={geom.cy - geom.ry * 0.15}
        rx={geom.rx * 0.2}
        ry={geom.ry * 0.2}
        fill="hsl(40, 45%, 60%)"
        transform={`rotate(${geom.rotation}, ${geom.cx}, ${geom.cy})`}
        opacity={0.35}
      />
    </G>
  );
}

// ─── Premium Cotyledons ────────────────────────
// Seed leaves with gradients and detail

function Cotyledons({ geom, palette }: {
  geom: NonNullable<PlantGeometry['cotyledons']>;
  palette: PlantGeometry['palette'];
}) {
  return (
    <>
      {geom.map((leaf, i) => {
        // Cotyledons are rounder than true leaves
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
        
        const cotylGradId = `cotylGrad_${i}`;
        
        return (
          <G
            key={i}
            transform={`translate(${leaf.base.x.toFixed(1)}, ${leaf.base.y.toFixed(1)}) rotate(${leaf.rotation})`}
          >
            <Defs>
              <RadialGradient
                id={cotylGradId}
                cx="30%"
                cy="30%"
                r="70%"
              >
                <Stop offset="0%" stopColor={palette.leaf} stopOpacity="0.7" />
                <Stop offset="100%" stopColor={palette.leafDark} stopOpacity="0.8" />
              </RadialGradient>
            </Defs>
            
            {/* Shadow */}
            <Path
              d={path}
              fill={palette.leafDark}
              opacity={0.15}
              transform="translate(0.1, 0.1)"
            />
            
            {/* Main body */}
            <Path
              d={path}
              fill={`url(#${cotylGradId})`}
              stroke={palette.leafDark}
              strokeWidth={0.4}
              opacity={0.9}
            />
            
            {/* Edge highlight */}
            <Path
              d={path}
              fill="none"
              stroke={palette.leaf}
              strokeWidth={0.2}
              opacity={0.25}
            />
          </G>
        );
      })}
    </>
  );
}

// ─── Harvest-Ready Glow Aura ────────────────────
// Premium glowing effect for harvestable plants

function HarvestGlow({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const glowId = 'harvestGlow';
  
  return (
    <>
      <Defs>
        <RadialGradient
          id={glowId}
          cx="50%"
          cy="50%"
          r="50%"
        >
          <Stop offset="0%" stopColor="hsl(65, 90%, 60%)" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="hsl(65, 90%, 60%)" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      
      {/* Outer glow aura */}
      <Circle
        cx={cx}
        cy={cy}
        r={r + 5}
        fill={`url(#${glowId})`}
        opacity={0.6}
      />
      
      {/* Inner glow ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="hsl(65, 90%, 60%)"
        strokeWidth={1.2}
        opacity={0.50}
      />
      
      {/* Outer subtle ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={r + 2.5}
        fill="none"
        stroke="hsl(65, 85%, 55%)"
        strokeWidth={0.6}
        opacity={0.25}
      />
    </>
  );
}

// ─── Main Component ───────────────────────────

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
