// ─────────────────────────────────────────────
// src/components/plants/parts/BasilTop.tsx
//
// Basil flower spike: a vertical raceme of tiny
// white/pale flowers stacked upward from the apex.
//
// Each "flower" is a small cross of ellipses.
// The spike is the most prominent feature of a
// flowering basil plant.
// ─────────────────────────────────────────────

import React from 'react';
import { G, Ellipse, Line, Circle } from 'react-native-svg';
import type { FlowerGeometry, PlantColorPalette } from '../types';

type BasilTopProps = {
  flowers: FlowerGeometry[];  // stacked vertically
  palette: PlantColorPalette;
  opacity?: number;
};

export function BasilTop({ flowers, palette, opacity = 1 }: BasilTopProps) {
  if (flowers.length === 0) return null;

  // Spike axis: from bottom flower to top flower
  const bottomY = flowers[flowers.length - 1]?.center.y ?? 0;
  const topY    = flowers[0]?.center.y ?? 0;
  const axisX   = flowers[0]?.center.x ?? 60;

  return (
    <G opacity={opacity}>
      {/* Spike axis — thin green stem */}
      <Line
        x1={axisX}
        y1={bottomY + 4}
        x2={axisX}
        y2={topY - 2}
        stroke={palette.stem}
        strokeWidth={0.9}
        strokeLinecap="round"
      />

      {/* Each bloom node */}
      {flowers.map((fl, i) => {
        const { center, petalR } = fl;
        const cx = center.x;
        const cy = center.y;

        // Whorled bracts: 4 small leaves at each node
        return (
          <G key={i}>
            {/* Bracts (tiny leaf pairs) */}
            <Ellipse
              cx={cx - petalR * 1.2} cy={cy}
              rx={petalR * 0.9} ry={petalR * 0.38}
              fill={palette.leaf}
              opacity={0.75}
            />
            <Ellipse
              cx={cx + petalR * 1.2} cy={cy}
              rx={petalR * 0.9} ry={petalR * 0.38}
              fill={palette.leaf}
              opacity={0.75}
            />

            {/* Flower petals — tiny cross */}
            <Circle
              cx={cx} cy={cy}
              r={petalR * 0.65}
              fill={palette.flower}
              opacity={0.92}
            />
            {/* Stamen dot */}
            <Circle
              cx={cx} cy={cy}
              r={petalR * 0.28}
              fill={palette.flowerCenter}
              opacity={0.88}
            />
          </G>
        );
      })}

      {/* Terminal bud at very top */}
      <Circle
        cx={axisX}
        cy={topY - 3}
        r={flowers[0]?.petalR ?? 2}
        fill={palette.leaf}
        opacity={0.65}
      />
    </G>
  );
}
