// ─────────────────────────────────────────────
// src/components/plants/parts/RadishRoot.tsx
//
// Radish root: bulbous shape half-buried in soil.
// Rendered below the BASE_Y soil line.
//
// The FruitGeometry.radius encodes root size.
// Center.y is already below BASE_Y (set by geom engine).
//
// Layers (back → front):
//   1. Tap root line going straight down
//   2. Soil occlusion rectangle (covers bottom half)
//   3. Root body (ellipse, partially above soil)
//   4. Colour sheen
//   5. Root crown fibres (tiny lines at top)
// ─────────────────────────────────────────────

import React from 'react';
import { G, Ellipse, Rect, Line, Circle, Path } from 'react-native-svg';
import type { FruitGeometry, PlantColorPalette } from '../types';

const SOIL_COLOR      = 'hsl(28, 30%, 16%)';
const SOIL_DARK_COLOR = 'hsl(25, 28%, 10%)';

type RadishRootProps = {
  fruit:        FruitGeometry;  // radius = root radius, center.y below BASE_Y
  palette:      PlantColorPalette;
  baseY:        number;
  harvestReady?: boolean;
};

export function RadishRoot({ fruit, palette, baseY, harvestReady }: RadishRootProps) {
  const { center, radius: r } = fruit;
  const cx = center.x;
  const cy = center.y;

  // Root: slightly taller than wide
  const rx = r * 0.75;
  const ry = r;

  // Tap root extends below the bulb
  const tapRootLen = r * 1.4;

  return (
    <G>
      {/* 1. Tap root */}
      <Line
        x1={cx}
        y1={cy + ry * 0.85}
        x2={cx + r * 0.08}
        y2={cy + ry + tapRootLen}
        stroke={palette.fruitDark}
        strokeWidth={r * 0.10}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* 2. Drop shadow */}
      <Ellipse
        cx={cx + 1}
        cy={cy + 2}
        rx={rx}
        ry={ry}
        fill={SOIL_DARK_COLOR}
        opacity={0.4}
      />

      {/* 3. Root body */}
      <Ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={palette.fruit}
        stroke={palette.fruitDark}
        strokeWidth={0.5}
      />

      {/* 4. Sheen — upper-left highlight */}
      <Ellipse
        cx={cx - rx * 0.28}
        cy={cy - ry * 0.25}
        rx={rx * 0.35}
        ry={ry * 0.28}
        fill={palette.fruitHighlight}
        opacity={0.55}
      />

      {/* 5. Soil occlusion — hides bottom of root below soil line */}
      <Rect
        x={cx - rx - 4}
        y={baseY}
        width={rx * 2 + 8}
        height={ry * 2 + tapRootLen + 6}
        fill={SOIL_COLOR}
      />

      {/* 6. Soil surface line */}
      <Line
        x1={cx - rx - 6}
        y1={baseY}
        x2={cx + rx + 6}
        y2={baseY}
        stroke={SOIL_DARK_COLOR}
        strokeWidth={1.2}
        opacity={0.6}
      />

      {/* 7. Root crown fibres at soil line */}
      {[-rx * 0.4, 0, rx * 0.4].map((dx, i) => (
        <Line
          key={i}
          x1={cx + dx}
          y1={baseY}
          x2={cx + dx + (i - 1) * r * 0.12}
          y2={baseY - r * 0.25}
          stroke={palette.stemDark}
          strokeWidth={0.7}
          strokeLinecap="round"
          opacity={0.55}
        />
      ))}

      {/* 8. Harvest-ready glow */}
      {harvestReady && (
        <Ellipse
          cx={cx}
          cy={cy}
          rx={rx + 3}
          ry={ry + 3}
          fill="none"
          stroke="hsl(65, 90%, 60%)"
          strokeWidth={1.5}
          opacity={0.35}
        />
      )}
    </G>
  );
}
