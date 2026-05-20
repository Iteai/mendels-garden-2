// ─────────────────────────────────────────────
// src/components/plants/parts/Fruit.tsx
// Tomato fruit: layered circles simulating volume
//
// Layers (back to front):
//   1. Shadow circle    — dark, full radius, slight offset down-right
//   2. Main body circle — primary fruit colour
//   3. Sheen arc        — lighter crescent, upper-left
//   4. Highlight dot    — small bright spot
//   5. Stem nub         — short line at top
//   6. Calyx tips       — tiny star points (harvest_ready only)
// ─────────────────────────────────────────────

import React from 'react';
import { G, Circle, Line, Path } from 'react-native-svg';
import type { FruitGeometry, PlantColorPalette } from '../types';

type FruitProps = {
  fruit: FruitGeometry;
  palette: PlantColorPalette;
  harvestReady?: boolean;
  opacity?: number;
};

export function Fruit({ fruit, palette, harvestReady = false, opacity = 1 }: FruitProps) {
  const { center, radius: r } = fruit;
  const { x: cx, y: cy } = center;

  // Highlight position: upper-left of centre
  const hlX = cx - r * 0.30;
  const hlY = cy - r * 0.30;

  // Sheen arc path (upper-left crescent)
  const sheenR = r * 0.72;
  const sheenPath = `
    M ${(cx - sheenR * 0.6).toFixed(1)} ${(cy - sheenR * 0.55).toFixed(1)}
    A ${sheenR} ${sheenR} 0 0 1
      ${(cx + sheenR * 0.0).toFixed(1)} ${(cy - sheenR * 0.72).toFixed(1)}
  `;

  // Calyx (star tips at top when harvest-ready)
  const calyxTipCount = 5;
  const calyxInner    = r * 0.18;
  const calyxOuter    = r * 0.38;
  const calyxBaseY    = cy - r;

  function calyxTip(i: number) {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    const tx = cx + Math.cos(angle) * calyxOuter;
    const ty = calyxBaseY + Math.sin(angle) * calyxOuter * 0.4;
    const bx = cx + Math.cos(angle + Math.PI / calyxTipCount) * calyxInner;
    const by = calyxBaseY + Math.sin(angle + Math.PI / calyxTipCount) * calyxInner;
    return `${i === 0 ? 'M' : 'L'} ${tx.toFixed(1)} ${ty.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`;
  }

  return (
    <G opacity={opacity}>
      {/* 1. Drop shadow */}
      <Circle
        cx={cx + r * 0.08}
        cy={cy + r * 0.08}
        r={r}
        fill={palette.fruitDark}
        opacity={0.35}
      />

      {/* 2. Main body */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill={palette.fruit}
      />

      {/* 3. Sheen arc */}
      <Path
        d={sheenPath}
        stroke={palette.fruitHighlight}
        strokeWidth={r * 0.28}
        fill="none"
        strokeLinecap="round"
        opacity={0.55}
      />

      {/* 4. Highlight dot */}
      <Circle
        cx={hlX}
        cy={hlY}
        r={r * 0.22}
        fill={palette.fruitHighlight}
        opacity={0.70}
      />

      {/* 5. Stem nub */}
      <Line
        x1={cx}
        y1={cy - r}
        x2={cx + r * 0.15}
        y2={cy - r - r * 0.32}
        stroke={palette.fruitStem}
        strokeWidth={r * 0.18}
        strokeLinecap="round"
      />

      {/* 6. Calyx star (harvest-ready glow) */}
      {harvestReady && (
        <Path
          d={Array.from({ length: calyxTipCount }, (_, i) => calyxTip(i)).join(' ') + ' Z'}
          fill={palette.stem}
          opacity={0.75}
        />
      )}
    </G>
  );
}

// ─── Fruit set ────────────────────────────────

type FruitSetProps = {
  fruits: FruitGeometry[];
  palette: PlantColorPalette;
  harvestReady?: boolean;
};

export function FruitSet({ fruits, palette, harvestReady }: FruitSetProps) {
  // Render smallest fruits first (they'll be behind larger ones)
  const sorted = [...fruits].sort((a, b) => a.radius - b.radius);
  return (
    <>
      {sorted.map((fr, i) => (
        <Fruit
          key={i}
          fruit={fr}
          palette={palette}
          harvestReady={harvestReady}
        />
      ))}
    </>
  );
}
