// ─────────────────────────────────────────────
// src/components/plants/parts/Fruit.tsx
// Premium fruit rendering with realistic volume,
// complex shading, multiple highlight layers,
// and sophisticated depth effects.
//
// Layered rendering (back to front):
//   1. Soft shadow cast
//   2. Main fruit body with radial gradient
//   3. Subsurface scattering hint
//   4. Sheen arc (reflected light)
//   5. Multiple highlight dots (wet look)
//   6. Stem nub with texture
//   7. Calyx details (harvest_ready only)
// ─────────────────────────────────────────────

import React from 'react';
import { Defs, G, Circle, Line, Path, RadialGradient, LinearGradient, Stop } from 'react-native-svg';
import type { FruitGeometry, PlantColorPalette } from '../types';

type FruitProps = {
  fruit: FruitGeometry;
  palette: PlantColorPalette;
  harvestReady?: boolean;
  opacity?: number;
  index?: number;
};

export function Fruit({ fruit, palette, harvestReady = false, opacity = 1, index = 0 }: FruitProps) {
  const { center, radius: r } = fruit;
  const { x: cx, y: cy } = center;

  // Unique gradient IDs
  const fruitGradId = `fruitGrad_${index}`;
  const glowGradId = `glowGrad_${index}`;
  const sheenGradId = `sheenGrad_${index}`;

  // ── POSITION CALCULATIONS ────────────────────

  // Primary highlight: upper-left
  const hlX = cx - r * 0.32;
  const hlY = cy - r * 0.35;

  // Secondary highlights for wet appearance
  const hl2X = cx + r * 0.20;
  const hl2Y = cy - r * 0.18;

  // Sheen arc (reflected light on upper surface)
  const sheenR = r * 0.68;
  const sheenPath = `
    M ${(cx - sheenR * 0.65).toFixed(1)} ${(cy - sheenR * 0.50).toFixed(1)}
    A ${sheenR.toFixed(1)} ${sheenR.toFixed(1)} 0 0 1
      ${(cx + sheenR * 0.20).toFixed(1)} ${(cy - sheenR * 0.70).toFixed(1)}
  `;

  // Calyx star (only on harvest-ready fruits)
  const calyxTipCount = 5;
  const calyxInner = r * 0.20;
  const calyxOuter = r * 0.42;
  const calyxBaseY = cy - r - 0.5;

  function calyxTip(i: number) {
    const angle = (i * 72 - 90) * (Math.PI / 180);
    const tx = cx + Math.cos(angle) * calyxOuter;
    const ty = calyxBaseY + Math.sin(angle) * calyxOuter * 0.5;
    const bx = cx + Math.cos(angle + Math.PI / calyxTipCount) * calyxInner;
    const by = calyxBaseY + Math.sin(angle + Math.PI / calyxTipCount) * calyxInner;
    return `${i === 0 ? 'M' : 'L'} ${tx.toFixed(1)} ${ty.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`;
  }

  return (
    <G opacity={opacity}>
      <Defs>
        {/* Main fruit radial gradient: volumetric sphere effect */}
        <RadialGradient
          id={fruitGradId}
          cx="35%"
          cy="35%"
          r="65%"
        >
          {/* Light side (lit) */}
          <Stop offset="0%" stopColor={palette.fruit} stopOpacity="0.95" />
          {/* Mid tone */}
          <Stop offset="40%" stopColor={palette.fruit} stopOpacity="1" />
          {/* Shadow side (darker, more saturated) */}
          <Stop offset="100%" stopColor={palette.fruitDark} stopOpacity="0.85" />
        </RadialGradient>

        {/* Glow effect for harvest-ready fruits */}
        <RadialGradient
          id={glowGradId}
          cx="50%"
          cy="50%"
          r="50%"
        >
          <Stop offset="0%" stopColor={palette.fruit} stopOpacity="0.1" />
          <Stop offset="100%" stopColor={palette.fruitDark} stopOpacity="0.04" />
        </RadialGradient>

        {/* Sheen gradient for realistic wet look */}
        <LinearGradient
          id={sheenGradId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <Stop offset="0%" stopColor={palette.fruitHighlight} stopOpacity="0.7" />
          <Stop offset="50%" stopColor={palette.fruitHighlight} stopOpacity="0.35" />
          <Stop offset="100%" stopColor={palette.fruit} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* 1. Soft cast shadow for depth */}
      <Circle
        cx={cx + r * 0.12}
        cy={cy + r * 0.15}
        r={r}
        fill={palette.fruitDark}
        opacity={0.18}
      />

      {/* 2. Subsurface scattering hint (soft glow under skin) */}
      {harvestReady && (
        <Circle
          cx={cx}
          cy={cy}
          r={r + 0.8}
          fill={`url(#${glowGradId})`}
          opacity={0.6}
        />
      )}

      {/* 3. Main fruit body with volumetric gradient */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill={`url(#${fruitGradId})`}
        opacity={0.98}
      />

      {/* 4. Specular highlight — wet, glossy appearance */}
      {/* Upper-left primary highlight */}
      <Circle
        cx={hlX}
        cy={hlY}
        r={r * 0.24}
        fill={palette.fruitHighlight}
        opacity={0.75}
      />

      {/* Secondary highlight for additional dimension */}
      <Circle
        cx={hl2X}
        cy={hl2Y}
        r={r * 0.15}
        fill={palette.fruitHighlight}
        opacity={0.55}
      />

      {/* 5. Sheen arc — reflected light on surface */}
      <Path
        d={sheenPath}
        stroke={`url(#${sheenGradId})`}
        strokeWidth={r * 0.26}
        fill="none"
        strokeLinecap="round"
        opacity={0.65}
      />

      {/* 6. Stem nub — attachment point to plant */}
      {/* Stem shadow */}
      <Line
        x1={cx + 0.1}
        y1={cy - r + 0.1}
        x2={cx + r * 0.18 + 0.1}
        y2={cy - r - r * 0.35 + 0.1}
        stroke={palette.fruitDark}
        strokeWidth={r * 0.20}
        strokeLinecap="round"
        opacity={0.25}
      />
      {/* Main stem */}
      <Line
        x1={cx}
        y1={cy - r}
        x2={cx + r * 0.15}
        y2={cy - r - r * 0.32}
        stroke={palette.fruitStem}
        strokeWidth={r * 0.18}
        strokeLinecap="round"
        opacity={0.85}
      />

      {/* 7. Calyx star — tiny leaf-like details at harvest */}
      {harvestReady && (
        <G>
          {/* Calyx shadow */}
          <Path
            d={Array.from({ length: calyxTipCount }, (_, i) => calyxTip(i)).join(' ') + ' Z'}
            fill={palette.stem}
            opacity={0.4}
            transform={`translate(0.15, 0.15)`}
          />
          {/* Calyx highlight */}
          <Path
            d={Array.from({ length: calyxTipCount }, (_, i) => calyxTip(i)).join(' ') + ' Z'}
            fill={palette.stem}
            opacity={0.85}
          />
        </G>
      )}

      {/* 8. Subtle edge darkening for realism */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={palette.fruitDark}
        strokeWidth={0.3}
        opacity={0.2}
        strokeLinecap="round"
      />
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
          index={i}
        />
      ))}
    </>
  );
}
