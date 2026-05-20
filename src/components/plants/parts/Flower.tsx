// ─────────────────────────────────────────────
// src/components/plants/parts/Flower.tsx
// 5-petal radial flower with stamen centre
//
// Each petal is a small ellipse rotated around the
// flower centre. The petal count and radius are
// driven by flowerSize phenotype trait.
// ─────────────────────────────────────────────

import React from 'react';
import { G, Ellipse, Circle, Path } from 'react-native-svg';
import type { FlowerGeometry, PlantColorPalette } from '../types';

type FlowerProps = {
  flower: FlowerGeometry;
  palette: PlantColorPalette;
  opacity?: number;
};

export function Flower({ flower, palette, opacity = 1 }: FlowerProps) {
  const { center, petalR, petalCount } = flower;
  const cx = center.x;
  const cy = center.y;

  // Petal dimensions: elongated ellipse
  const petalMajor = petalR;
  const petalMinor = petalR * 0.44;

  // Petal offset from centre (petal base to centre gap)
  const petalOffset = petalR * 0.55;

  // Stamen (centre circle)
  const stamenR = petalR * 0.38;

  // Angle between petals
  const step = 360 / petalCount;

  // Small connecting calyx below flower
  const calyxPath = `M ${cx} ${cy + stamenR} Q ${cx - petalR} ${cy + petalR * 1.8} ${cx} ${cy + petalR * 2}`;
  const calyxPath2 = `M ${cx} ${cy + stamenR} Q ${cx + petalR} ${cy + petalR * 1.8} ${cx} ${cy + petalR * 2}`;

  return (
    <G opacity={opacity}>
      {/* Calyx (tiny green base) */}
      <Path
        d={calyxPath}
        stroke={palette.stem}
        strokeWidth={0.7}
        fill="none"
        opacity={0.6}
      />
      <Path
        d={calyxPath2}
        stroke={palette.stem}
        strokeWidth={0.7}
        fill="none"
        opacity={0.6}
      />

      {/* Petals — rendered back-to-front */}
      {Array.from({ length: petalCount }, (_, i) => {
        const angle = i * step - 90; // start at top
        const rad   = (angle * Math.PI) / 180;
        // Centre of each petal ellipse offset from flower centre
        const pcx = cx + Math.cos(rad) * petalOffset;
        const pcy = cy + Math.sin(rad) * petalOffset;
        return (
          <Ellipse
            key={i}
            cx={pcx}
            cy={pcy}
            rx={petalMinor}
            ry={petalMajor}
            fill={palette.flower}
            stroke={palette.flowerCenter}
            strokeWidth={0.3}
            opacity={0.92}
            transform={`rotate(${angle}, ${pcx}, ${pcy})`}
          />
        );
      })}

      {/* Stamen — bright centre dot */}
      <Circle
        cx={cx}
        cy={cy}
        r={stamenR + 0.5}
        fill={palette.flowerCenter}
        opacity={0.85}
      />
      <Circle
        cx={cx - stamenR * 0.25}
        cy={cy - stamenR * 0.25}
        r={stamenR * 0.4}
        fill={palette.flower}
        opacity={0.6}
      />
    </G>
  );
}

// ─── Flower set ───────────────────────────────

type FlowerSetProps = {
  flowers: FlowerGeometry[];
  palette: PlantColorPalette;
  opacity?: number;
};

export function FlowerSet({ flowers, palette, opacity }: FlowerSetProps) {
  return (
    <>
      {flowers.map((fl, i) => (
        <Flower key={i} flower={fl} palette={palette} opacity={opacity} />
      ))}
    </>
  );
}
