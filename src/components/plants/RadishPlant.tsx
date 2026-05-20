// ─────────────────────────────────────────────
// src/components/plants/RadishPlant.tsx
// Rosette herb — strap leaves, visible underground root
// ─────────────────────────────────────────────

import React from 'react';
import { Svg, G, Ellipse, Path } from 'react-native-svg';
import { Stem }        from './parts/Stem';
import { LeafSet }     from './parts/Leaf';
import { FlowerSet }   from './parts/Flower';
import { RadishRoot }  from './parts/RadishRoot';
import type { PlantGeometry } from './types';

type RadishPlantProps = { geometry: PlantGeometry; width: number; height: number };

export function RadishPlant({ geometry: g, width, height }: RadishPlantProps) {
  const isHarvestReady = g.stage === 'harvest_ready';
  const hasRoot        = g.fruits.length > 0 && g.stage !== 'seed' && g.stage !== 'sprout';

  return (
    <Svg width={width} height={height}
      viewBox={`0 0 ${g.viewBoxW} ${g.viewBoxH}`}
      preserveAspectRatio="xMidYMax meet">
      <G opacity={g.opacity}>

        {/* Seed */}
        {g.seedEllipse && (
          <Ellipse
            cx={g.seedEllipse.cx} cy={g.seedEllipse.cy}
            rx={g.seedEllipse.rx} ry={g.seedEllipse.ry}
            fill="hsl(30,38%,28%)"
            transform={`rotate(${g.seedEllipse.rotation},${g.seedEllipse.cx},${g.seedEllipse.cy})`}
          />
        )}

        {/* Root rendered first (behind everything else) */}
        {hasRoot && g.fruits[0] && (
          <RadishRoot
            fruit={g.fruits[0]}
            palette={g.palette}
            baseY={g.baseY}
            harvestReady={isHarvestReady}
          />
        )}

        {/* Short stem */}
        {g.stem && (
          <Stem stem={g.stem} branches={[]} palette={g.palette} />
        )}

        {/* Cotyledons */}
        {g.cotyledons?.map((leaf, i) => {
          const L=leaf.length, W=leaf.width;
          const path=[`M 0 0`,`C ${(L*0.22).toFixed(1)} ${(-W*0.68).toFixed(1)}, ${(L*0.55).toFixed(1)} ${(-W*0.72).toFixed(1)}, ${L.toFixed(1)} 0`,`C ${(L*0.55).toFixed(1)} ${(W*0.72).toFixed(1)}, ${(L*0.22).toFixed(1)} ${(W*0.68).toFixed(1)}, 0 0 Z`].join(' ');
          return (
            <G key={i} transform={`translate(${leaf.base.x.toFixed(1)},${leaf.base.y.toFixed(1)}) rotate(${leaf.rotation})`}>
              <Path d={path} fill={g.palette.leaf} stroke={g.palette.leafDark} strokeWidth={0.4} opacity={0.85} />
            </G>
          );
        })}

        {/* Rosette leaves */}
        <LeafSet leaves={g.leaves} palette={g.palette} />

        {/* Bolting flowers at harvest_ready */}
        {g.flowers.length > 0 && (
          <FlowerSet flowers={g.flowers} palette={g.palette} opacity={0.90} />
        )}

      </G>
    </Svg>
  );
}
