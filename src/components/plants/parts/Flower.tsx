// ─────────────────────────────────────────────
// src/components/plants/parts/Flower.tsx
// Premium botanical flower with complex petals,
// layered stamen, realistic color gradients,
// depth shadows, and subtle organic variation.
//
// Each petal is a complex bezier shape with
// gradient fill, shadow, and highlight effects.
// ─────────────────────────────────────────────

import React from 'react';
import { Defs, G, Path, Circle, Ellipse, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import type { FlowerGeometry, PlantColorPalette } from '../types';

type FlowerProps = {
  flower: FlowerGeometry;
  palette: PlantColorPalette;
  opacity?: number;
  index?: number;
};

export function Flower({ flower, palette, opacity = 1, index = 0 }: FlowerProps) {
  const { center, petalR, petalCount } = flower;
  const cx = center.x;
  const cy = center.y;

  // Unique IDs for gradients
  const petalGradId = `petalGrad_${index}`;
  const stamenGradId = `stamenGrad_${index}`;
  const petalShadowId = `petalShadow_${index}`;

  // Petal dimensions: more organic, less symmetrical
  const petalMajor = petalR;
  const petalMinor = petalR * 0.42;

  // Petal offset from centre
  const petalOffset = petalR * 0.50;

  // Stamen (complex centre)
  const stamenR = petalR * 0.38;
  const stamenInnerR = stamenR * 0.4;

  // Angle between petals
  const step = 360 / petalCount;

  // ── PETAL CONSTRUCTION ──────────────────────

  // Build a complex petal shape using bezier curves
  function petalPath(centerX: number, centerY: number, angle: number): string {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Petal tip (furthest from flower center)
    const tipX = centerX + cos * petalMajor * 0.9;
    const tipY = centerY + sin * petalMajor * 0.9;

    // Petal base (where it connects to stamen)
    const baseX = centerX + cos * petalOffset * 0.7;
    const baseY = centerY + sin * petalOffset * 0.7;

    // Control points for left and right curves (create petal width)
    const leftX = centerX + (cos - sin * 0.7) * (petalMinor + 1);
    const leftY = centerY + (sin + cos * 0.7) * (petalMinor + 1);
    const rightX = centerX + (cos + sin * 0.7) * (petalMinor + 1);
    const rightY = centerY + (sin - cos * 0.7) * (petalMinor + 1);

    return [
      `M ${baseX.toFixed(1)} ${baseY.toFixed(1)}`,
      `C ${leftX.toFixed(1)} ${leftY.toFixed(1)},`,
      `  ${(tipX - cos * petalMajor * 0.3).toFixed(1)} ${(tipY - sin * petalMajor * 0.3).toFixed(1)},`,
      `  ${tipX.toFixed(1)} ${tipY.toFixed(1)}`,
      `C ${(tipX + cos * petalMajor * 0.3).toFixed(1)} ${(tipY + sin * petalMajor * 0.3).toFixed(1)},`,
      `  ${rightX.toFixed(1)} ${rightY.toFixed(1)},`,
      `  ${baseX.toFixed(1)} ${baseY.toFixed(1)}`,
      `Z`,
    ].join(' ');
  }

  // ── CALYX (tiny green base) ────────────────────

  const calyxPath = `
    M ${(cx - petalR * 0.4).toFixed(1)} ${(cy + petalR * 0.3).toFixed(1)}
    Q ${(cx - petalR * 0.2).toFixed(1)} ${(cy + petalR * 1.4).toFixed(1)}
    ${cx.toFixed(1)} ${(cy + petalR * 1.8).toFixed(1)}
    Q ${(cx + petalR * 0.2).toFixed(1)} ${(cy + petalR * 1.4).toFixed(1)}
    ${(cx + petalR * 0.4).toFixed(1)} ${(cy + petalR * 0.3).toFixed(1)}
  `;

  return (
    <G opacity={opacity}>
      <Defs>
        {/* Petal gradient: warm tones */}
        <LinearGradient
          id={petalGradId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <Stop offset="0%" stopColor={palette.flower} stopOpacity="0.8" />
          <Stop offset="50%" stopColor={palette.flower} stopOpacity="1" />
          <Stop offset="100%" stopColor={palette.flowerCenter} stopOpacity="0.6" />
        </LinearGradient>

        {/* Stamen gradient: radial glow from center */}
        <RadialGradient
          id={stamenGradId}
          cx="50%"
          cy="50%"
          r="50%"
        >
          <Stop offset="0%" stopColor={palette.flowerCenter} stopOpacity="1" />
          <Stop offset="70%" stopColor={palette.flower} stopOpacity="0.7" />
          <Stop offset="100%" stopColor={palette.flower} stopOpacity="0.3" />
        </RadialGradient>

        {/* Petal shadow for depth */}
        <LinearGradient
          id={petalShadowId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <Stop offset="0%" stopColor={palette.flowerCenter} stopOpacity="0.1" />
          <Stop offset="100%" stopColor={palette.flowerCenter} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* 1. Soft shadow under petals */}
      <Circle
        cx={cx}
        cy={cy + petalR * 0.15}
        r={petalR * 0.8}
        fill={palette.flowerCenter}
        opacity={0.08}
      />

      {/* 2. Petals — rendered back-to-front */}
      {Array.from({ length: petalCount }, (_, i) => {
        const angle = i * step - 90; // start at top
        return (
          <G key={`petal-${i}`}>
            {/* Petal shadow for depth */}
            <Path
              d={petalPath(cx + 0.15, cy + 0.1, angle)}
              fill={palette.flowerCenter}
              opacity={0.1}
            />
            {/* Petal body with gradient */}
            <Path
              d={petalPath(cx, cy, angle)}
              fill={`url(#${petalGradId})`}
              stroke={palette.flowerCenter}
              strokeWidth={0.25}
              strokeLinejoin="round"
              opacity={0.95}
            />
            {/* Petal highlight edge */}
            <Path
              d={petalPath(cx, cy, angle)}
              fill="none"
              stroke={palette.flower}
              strokeWidth={0.15}
              opacity={0.25}
              strokeLinejoin="round"
            />
          </G>
        );
      })}

      {/* 3. Calyx (green base) */}
      <Path
        d={calyxPath}
        fill={palette.stem}
        opacity={0.5}
        stroke={palette.stemDark}
        strokeWidth={0.4}
        strokeLinecap="round"
      />

      {/* 4. Stamen — layered center disc */}
      {/* Outer stamen ring */}
      <Circle
        cx={cx}
        cy={cy}
        r={stamenR + 0.3}
        fill={`url(#${stamenGradId})`}
        opacity={0.75}
      />

      {/* Middle stamen layer with pollen dots */}
      <Circle
        cx={cx}
        cy={cy}
        r={stamenR}
        fill={palette.flowerCenter}
        opacity={0.88}
      />

      {/* Pollen texture: small dots around stamen */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i * 60) * (Math.PI / 180);
        const px = cx + Math.cos(angle) * (stamenR * 0.65);
        const py = cy + Math.sin(angle) * (stamenR * 0.65);
        return (
          <Circle
            key={`pollen-${i}`}
            cx={px}
            cy={py}
            r={0.3}
            fill={palette.flower}
            opacity={0.6}
          />
        );
      })}

      {/* Inner stamen core (bright highlight) */}
      <Circle
        cx={cx - stamenInnerR * 0.3}
        cy={cy - stamenInnerR * 0.3}
        r={stamenInnerR}
        fill={palette.flower}
        opacity={0.55}
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
        <Flower key={i} flower={fl} palette={palette} opacity={opacity} index={i} />
      ))}
    </>
  );
}
