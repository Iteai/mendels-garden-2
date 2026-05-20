// ─────────────────────────────────────────────
// src/components/plants/BasilPlant.tsx
// Dense bushy herb — broad leaves, flower spikes
// ─────────────────────────────────────────────

import React from 'react';
import { Svg, G, Ellipse, Path } from 'react-native-svg';
import { Stem }       from './parts/Stem';
import { LeafSet }    from './parts/Leaf';
import { BasilTop }   from './parts/BasilTop';
import type { PlantGeometry } from './types';

function SoilLayer({ cx, baseY, palette }: { cx:number; baseY:number; palette:PlantGeometry['palette'] }) {
  return (
    <Ellipse cx={cx} cy={baseY} rx={20} ry={4} fill={palette.stemDark} opacity={0.28} />
  );
}

type BasilPlantProps = { geometry: PlantGeometry; width: number; height: number };

export function BasilPlant({ geometry: g, width, height }: BasilPlantProps) {
  const showSoil = g.stage === 'seed' || g.stage === 'sprout';

  return (
    <Svg width={width} height={height}
      viewBox={`0 0 ${g.viewBoxW} ${g.viewBoxH}`}
      preserveAspectRatio="xMidYMax meet">
      <G opacity={g.opacity}>

        {showSoil && <SoilLayer cx={g.cx} baseY={g.baseY} palette={g.palette} />}

        {/* Seed shape */}
        {g.seedEllipse && (
          <Ellipse
            cx={g.seedEllipse.cx} cy={g.seedEllipse.cy}
            rx={g.seedEllipse.rx} ry={g.seedEllipse.ry}
            fill="hsl(30,38%,28%)"
            transform={`rotate(${g.seedEllipse.rotation},${g.seedEllipse.cx},${g.seedEllipse.cy})`}
          />
        )}

        {/* Stem (short) */}
        {g.stem && (
          <Stem stem={g.stem} branches={g.branches} palette={g.palette} />
        )}

        {/* Cotyledons */}
        {g.cotyledons?.map((leaf, i) => {
          const L=leaf.length, W=leaf.width;
          const path=[`M 0 0`,`C ${(L*0.22).toFixed(1)} ${(-W*0.72).toFixed(1)}, ${(L*0.55).toFixed(1)} ${(-W*0.76).toFixed(1)}, ${L.toFixed(1)} 0`,`C ${(L*0.55).toFixed(1)} ${(W*0.76).toFixed(1)}, ${(L*0.22).toFixed(1)} ${(W*0.72).toFixed(1)}, 0 0 Z`].join(' ');
          return (
            <G key={i} transform={`translate(${leaf.base.x.toFixed(1)},${leaf.base.y.toFixed(1)}) rotate(${leaf.rotation})`}>
              <Path d={path} fill={g.palette.leaf} stroke={g.palette.leafDark} strokeWidth={0.4} opacity={0.88} />
            </G>
          );
        })}

        {/* Broad leaves */}
        <LeafSet leaves={g.leaves} palette={g.palette} />

        {/* Flower spike at apex */}
        {g.flowers.length > 0 && (
          <BasilTop flowers={g.flowers} palette={g.palette} opacity={g.stage==='decaying'?0.35:1} />
        )}

      </G>
    </Svg>
  );
}
