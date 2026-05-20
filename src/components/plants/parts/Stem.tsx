// ─────────────────────────────────────────────
// src/components/plants/parts/Stem.tsx
// Renders the main stem and all branch paths
// ─────────────────────────────────────────────

import React from 'react';
import { G, Path, Circle } from 'react-native-svg';
import type { StemGeometry, BranchGeometry, PlantColorPalette } from '../types';

type StemProps = {
  stem: StemGeometry;
  branches: BranchGeometry[];
  palette: PlantColorPalette;
  opacity?: number;
};

export function Stem({ stem, branches, palette, opacity = 1 }: StemProps) {
  const { base, apex, control, width } = stem;

  // Main stem bezier path
  const stemPath =
    `M ${base.x.toFixed(1)} ${base.y.toFixed(1)} ` +
    `Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ` +
    `${apex.x.toFixed(1)} ${apex.y.toFixed(1)}`;

  return (
    <G opacity={opacity}>
      {/* Drop shadow / dark underside */}
      <Path
        d={stemPath}
        stroke={palette.stemDark}
        strokeWidth={width + 0.8}
        strokeLinecap="round"
        fill="none"
      />
      {/* Main stem */}
      <Path
        d={stemPath}
        stroke={palette.stem}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
      />

      {/* Branches */}
      {branches.map((br, i) => {
        const { node, end, ctrl, width: bw } = br;
        const branchPath =
          `M ${node.x.toFixed(1)} ${node.y.toFixed(1)} ` +
          `Q ${ctrl.x.toFixed(1)} ${ctrl.y.toFixed(1)} ` +
          `${end.x.toFixed(1)} ${end.y.toFixed(1)}`;

        return (
          <G key={i}>
            {/* Branch shadow */}
            <Path
              d={branchPath}
              stroke={palette.stemDark}
              strokeWidth={bw + 0.5}
              strokeLinecap="round"
              fill="none"
            />
            {/* Branch */}
            <Path
              d={branchPath}
              stroke={palette.stem}
              strokeWidth={bw}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        );
      })}

      {/* Node dots where branches attach — botanical detail */}
      {branches
        .filter((_, i) => i % 2 === 0) // one dot per pair
        .map((br, i) => (
          <Circle
            key={i}
            cx={br.node.x}
            cy={br.node.y}
            r={width * 0.55}
            fill={palette.stemDark}
            opacity={0.7}
          />
        ))}
    </G>
  );
}
