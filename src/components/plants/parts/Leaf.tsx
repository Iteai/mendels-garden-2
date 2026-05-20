// ─────────────────────────────────────────────
// src/components/plants/parts/Leaf.tsx
// Single leaf: pointed bezier oval + midrib vein
//
// Coordinate model:
//   Local space: leaf base at origin, tip points along +X axis
//   SVG transform: translate(base.x, base.y) rotate(rotation)
//   rotation = 0   → leaf points RIGHT
//   rotation = -90 → leaf points UP
//   rotation = -130 → leaf points upper-left (left branch)
// ─────────────────────────────────────────────

import React from 'react';
import { G, Path, Line } from 'react-native-svg';
import type { LeafGeometry, PlantColorPalette } from '../types';

type LeafProps = {
  leaf: LeafGeometry;
  palette: PlantColorPalette;
};

export function Leaf({ leaf, palette }: LeafProps) {
  const { base, rotation, length: L, width: W, opacity } = leaf;

  // Leaf outline — two quadratic bezier arcs meeting at tip
  // Local coords: base at (0,0), tip at (L, 0)
  // Upper arc: M 0 0  Q L*0.35 -W  L 0
  // Lower arc: back   Q L*0.35  W  0 0
  const leafPath = [
    `M 0 0`,
    `C ${(L * 0.25).toFixed(1)} ${(-W * 0.65).toFixed(1)},`,
    `  ${(L * 0.60).toFixed(1)} ${(-W * 0.72).toFixed(1)},`,
    `  ${L.toFixed(1)} 0`,
    `C ${(L * 0.60).toFixed(1)} ${(W * 0.72).toFixed(1)},`,
    `  ${(L * 0.25).toFixed(1)} ${(W * 0.65).toFixed(1)},`,
    `0 0 Z`,
  ].join(' ');

  // Midrib: straight line from base to near tip
  const veinEndX = L * 0.88;

  // Transform string: translate then rotate
  const transform = `translate(${base.x.toFixed(1)}, ${base.y.toFixed(1)}) rotate(${rotation})`;

  return (
    <G transform={transform} opacity={opacity}>
      {/* Leaf body */}
      <Path
        d={leafPath}
        fill={palette.leaf}
        stroke={palette.leafDark}
        strokeWidth={0.4}
        strokeLinejoin="round"
      />
      {/* Midrib vein */}
      <Line
        x1={0}
        y1={0}
        x2={veinEndX}
        y2={0}
        stroke={palette.leafVein}
        strokeWidth={0.5}
        strokeLinecap="round"
        opacity={0.7}
      />
    </G>
  );
}

// ─── Leaf set ─────────────────────────────────
// Renders a collection of leaves efficiently

type LeafSetProps = {
  leaves: LeafGeometry[];
  palette: PlantColorPalette;
};

export function LeafSet({ leaves, palette }: LeafSetProps) {
  return (
    <>
      {leaves.map((leaf, i) => (
        <Leaf key={i} leaf={leaf} palette={palette} />
      ))}
    </>
  );
}
