// ─────────────────────────────────────────────
// src/components/plants/parts/ChiliFruit.tsx
//
// Elongated chili pepper hanging from branch tip.
// Shape: tapered oval with pointed bottom.
// Hangs downward; stem nub at top.
//
// The FruitGeometry.radius field encodes pepper
// length (not radius) for chili plants.
// ─────────────────────────────────────────────

import React from 'react';
import { G, Path, Line, Circle } from 'react-native-svg';
import type { FruitGeometry, PlantColorPalette } from '../types';

type ChiliFruitProps = {
  fruit:        FruitGeometry;
  palette:      PlantColorPalette;
  harvestReady?: boolean;
  opacity?:     number;
};

export function ChiliFruit({
  fruit, palette, harvestReady = false, opacity = 1,
}: ChiliFruitProps) {
  const { center, radius: pepperLen } = fruit;
  const cx = center.x;
  const cy = center.y;  // vertical centre of the pepper body

  const W   = pepperLen * 0.28;   // width at widest point
  const top = cy - pepperLen * 0.5;
  const bot = cy + pepperLen * 0.5;

  // Pepper body: wide at top-third, tapers to a curved tip at bottom
  // Local path, then translated
  const bodyPath = [
    `M ${cx} ${top}`,
    // Right side: curves out then tapers to pointed tip
    `C ${(cx + W * 1.1).toFixed(1)} ${(top + pepperLen * 0.25).toFixed(1)},`,
    `  ${(cx + W).toFixed(1)} ${(top + pepperLen * 0.65).toFixed(1)},`,
    `  ${cx} ${bot.toFixed(1)}`,
    // Left side: mirror
    `C ${(cx - W).toFixed(1)} ${(top + pepperLen * 0.65).toFixed(1)},`,
    `  ${(cx - W * 1.1).toFixed(1)} ${(top + pepperLen * 0.25).toFixed(1)},`,
    `  ${cx} ${top}`,
    'Z',
  ].join(' ');

  // Sheen stripe: thin lighter line on right side
  const sheenPath = [
    `M ${(cx + W * 0.4).toFixed(1)} ${(top + pepperLen * 0.10).toFixed(1)}`,
    `Q ${(cx + W * 0.9).toFixed(1)} ${(top + pepperLen * 0.38).toFixed(1)}`,
    `  ${(cx + W * 0.6).toFixed(1)} ${(top + pepperLen * 0.62).toFixed(1)}`,
  ].join(' ');

  // Stem nub at top
  const stemTopY = top - pepperLen * 0.18;

  return (
    <G opacity={opacity}>
      {/* Drop shadow */}
      <Path
        d={bodyPath}
        fill={palette.fruitDark}
        opacity={0.3}
        transform={`translate(1.5, 1.5)`}
      />
      {/* Pepper body */}
      <Path
        d={bodyPath}
        fill={palette.fruit}
        stroke={palette.fruitDark}
        strokeWidth={0.4}
      />
      {/* Sheen */}
      <Path
        d={sheenPath}
        stroke={palette.fruitHighlight}
        strokeWidth={W * 0.35}
        fill="none"
        strokeLinecap="round"
        opacity={0.55}
      />
      {/* Calyx / cap at top */}
      <Circle
        cx={cx}
        cy={top}
        r={W * 0.45}
        fill={palette.stem}
        opacity={0.9}
      />
      {/* Stem nub */}
      <Line
        x1={cx}
        y1={top}
        x2={cx + pepperLen * 0.06}
        y2={stemTopY}
        stroke={palette.fruitStem}
        strokeWidth={W * 0.25}
        strokeLinecap="round"
      />
      {/* Harvest-ready glow dot */}
      {harvestReady && (
        <Circle
          cx={cx}
          cy={cy}
          r={W * 0.3}
          fill={palette.fruitHighlight}
          opacity={0.5}
        />
      )}
    </G>
  );
}

type ChiliFruitSetProps = {
  fruits:       FruitGeometry[];
  palette:      PlantColorPalette;
  harvestReady?: boolean;
};

export function ChiliFruitSet({ fruits, palette, harvestReady }: ChiliFruitSetProps) {
  return (
    <>
      {fruits.map((fr, i) => (
        <ChiliFruit key={i} fruit={fr} palette={palette} harvestReady={harvestReady} />
      ))}
    </>
  );
}
