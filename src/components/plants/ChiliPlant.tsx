// ─────────────────────────────────────────────
// src/components/plants/ChiliPlant.tsx
// Upright chili plant: narrow leaves, hanging peppers
// ─────────────────────────────────────────────

import React from 'react';
import { Svg, G, Ellipse, Path, Line } from 'react-native-svg';
import { Stem }          from './parts/Stem';
import { LeafSet }       from './parts/Leaf';
import { FlowerSet }     from './parts/Flower';
import { ChiliFruitSet } from './parts/ChiliFruit';
import type { PlantGeometry, LeafGeometry } from './types';

function SoilLayer({ cx, baseY, palette }: { cx:number; baseY:number; palette:PlantGeometry['palette'] }) {
  return <Ellipse cx={cx} cy={baseY} rx={14} ry={3} fill={palette.stemDark} opacity={0.30} />;
}

function HarvestGlow({ cx, cy, r }: { cx:number; cy:number; r:number }) {
  return (
    <>
      <Ellipse cx={cx} cy={cy} rx={r} ry={r*0.9} fill="none" stroke="hsl(65,90%,60%)" strokeWidth={1.5} opacity={0.38} />
      <Ellipse cx={cx} cy={cy} rx={r+3} ry={r*0.9+3} fill="none" stroke="hsl(65,85%,55%)" strokeWidth={0.7} opacity={0.18} />
    </>
  );
}

// Inline cotyledon renderer — avoids dynamic require
function CotyledonLeaf({ leaf, palette }: { leaf: LeafGeometry; palette: PlantGeometry['palette'] }) {
  const L = leaf.length, W = leaf.width;
  const path = [
    `M 0 0`,
    `C ${(L*0.22).toFixed(1)} ${(-W*0.72).toFixed(1)},`,
    `  ${(L*0.55).toFixed(1)} ${(-W*0.76).toFixed(1)},`,
    `  ${L.toFixed(1)} 0`,
    `C ${(L*0.55).toFixed(1)} ${(W*0.76).toFixed(1)},`,
    `  ${(L*0.22).toFixed(1)} ${(W*0.72).toFixed(1)},`,
    `0 0 Z`,
  ].join(' ');
  return (
    <G transform={`translate(${leaf.base.x.toFixed(1)},${leaf.base.y.toFixed(1)}) rotate(${leaf.rotation})`}>
      <Path d={path} fill={palette.leaf} stroke={palette.leafDark} strokeWidth={0.4} opacity={0.85} />
    </G>
  );
}

type ChiliPlantProps = { geometry: PlantGeometry; width: number; height: number };

export function ChiliPlant({ geometry: g, width, height }: ChiliPlantProps) {
  const isHarvestReady = g.stage === 'harvest_ready';
  const showSoil       = g.stage === 'seed' || g.stage === 'sprout';

  const glowCY = g.stem
    ? g.stem.apex.y + (g.baseY - g.stem.apex.y) * 0.5
    : g.baseY - 24;

  return (
    <Svg width={width} height={height}
      viewBox={`0 0 ${g.viewBoxW} ${g.viewBoxH}`}
      preserveAspectRatio="xMidYMax meet">
      <G opacity={g.opacity}>

        {showSoil && <SoilLayer cx={g.cx} baseY={g.baseY} palette={g.palette} />}

        {/* Seed */}
        {g.seedEllipse && (
          <G>
            <Ellipse
              cx={g.seedEllipse.cx} cy={g.seedEllipse.cy}
              rx={g.seedEllipse.rx} ry={g.seedEllipse.ry}
              fill="hsl(30,38%,28%)"
              transform={`rotate(${g.seedEllipse.rotation},${g.seedEllipse.cx},${g.seedEllipse.cy})`}
            />
            <Line
              x1={g.seedEllipse.cx - g.seedEllipse.rx*0.6} y1={g.seedEllipse.cy}
              x2={g.seedEllipse.cx + g.seedEllipse.rx*0.6} y2={g.seedEllipse.cy}
              stroke="hsl(30,25%,40%)" strokeWidth={0.6} strokeLinecap="round"
              transform={`rotate(${g.seedEllipse.rotation},${g.seedEllipse.cx},${g.seedEllipse.cy})`}
              opacity={0.55}
            />
          </G>
        )}

        {/* Peppers behind stem */}
        {g.fruits.length > 0 && (
          <ChiliFruitSet fruits={g.fruits} palette={g.palette} harvestReady={isHarvestReady} />
        )}

        {/* Stem + branches */}
        {g.stem && (
          <Stem stem={g.stem} branches={g.branches} palette={g.palette} />
        )}

        {/* Cotyledons */}
        {g.cotyledons?.map((leaf, i) => (
          <CotyledonLeaf key={i} leaf={leaf} palette={g.palette} />
        ))}

        {/* Narrow leaves */}
        <LeafSet leaves={g.leaves} palette={g.palette} />

        {/* Small white flowers */}
        {g.flowers.length > 0 && (
          <FlowerSet flowers={g.flowers} palette={g.palette}
            opacity={g.stage === 'decaying' ? 0.4 : 0.95} />
        )}

        {isHarvestReady && (
          <HarvestGlow cx={g.cx} cy={glowCY} r={20} />
        )}
      </G>
    </Svg>
  );
}
