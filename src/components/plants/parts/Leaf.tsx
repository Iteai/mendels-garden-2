// ─────────────────────────────────────────────
// src/components/plants/parts/Leaf.tsx
// Professional botanical leaf with multiple veins,
// gradient fill, subtle shape asymmetry, and depth
//
// Coordinate model:
//   Local space: leaf base at origin, tip points along +X axis
//   SVG transform: translate(base.x, base.y) rotate(rotation)
//   rotation = 0   → leaf points RIGHT
//   rotation = -90 → leaf points UP
//   rotation = -130 → leaf points upper-left (left branch)
//
// Advanced features:
//   - Layered shadow effect for depth
//   - Gradient fill for botanical realism
//   - Multiple veins with hierarchy (midrib + laterals)
//   - Subtle edge highlights
//   - Natural shape asymmetry
// ─────────────────────────────────────────────

import React from 'react';
import { Defs, G, Path, Line, LinearGradient, Stop } from 'react-native-svg';
import type { LeafGeometry, PlantColorPalette } from '../types';

type LeafProps = {
  leaf: LeafGeometry;
  palette: PlantColorPalette;
  index?: number; // for unique gradient IDs
};

export function Leaf({ leaf, palette, index = 0 }: LeafProps) {
  const { base, rotation, length: L, width: W, opacity } = leaf;

  // Unique gradient ID per leaf to avoid conflicts
  const gradId = `leafGrad_${index}`;
  const shadowId = `leafShadow_${index}`;

  // ── OUTLINE ────────────────────────────────────
  // More organic shape with asymmetry — upper and lower curves differ slightly
  // Upper edge: slightly sharper
  // Lower edge: slightly rounder
  // This adds natural variation without looking procedurally generated

  const leafPath = [
    `M 0 0`,
    // Upper curve — slightly sharper approach to tip
    `C ${(L * 0.22).toFixed(1)} ${(-W * 0.68).toFixed(1)},`,
    `  ${(L * 0.58).toFixed(1)} ${(-W * 0.75).toFixed(1)},`,
    `  ${L.toFixed(1)} 0`,
    // Lower curve — rounder approach to tip
    `C ${(L * 0.62).toFixed(1)} ${(W * 0.70).toFixed(1)},`,
    `  ${(L * 0.20).toFixed(1)} ${(W * 0.68).toFixed(1)},`,
    `0 0 Z`,
  ].join(' ');

  // ── SHADOW PATH ────────────────────────────────
  // Slightly offset shadow for depth
  const shadowPath = [
    `M ${(0 + 0.15).toFixed(1)} ${(0 + 0.15).toFixed(1)}`,
    `C ${(L * 0.22 + 0.15).toFixed(1)} ${(-W * 0.68 + 0.15).toFixed(1)},`,
    `  ${(L * 0.58 + 0.15).toFixed(1)} ${(-W * 0.75 + 0.15).toFixed(1)},`,
    `  ${(L + 0.15).toFixed(1)} ${(0 + 0.15).toFixed(1)}`,
    `C ${(L * 0.62 + 0.15).toFixed(1)} ${(W * 0.70 + 0.15).toFixed(1)},`,
    `  ${(L * 0.20 + 0.15).toFixed(1)} ${(W * 0.68 + 0.15).toFixed(1)},`,
    `${(0 + 0.15).toFixed(1)} ${(0 + 0.15).toFixed(1)} Z`,
  ].join(' ');

  // ── VEIN SYSTEM ────────────────────────────────
  // Midrib (main vein down center)
  const midribX = L * 0.85;

  // Lateral veins branching off midrib
  // Create 3-4 pairs for a natural look
  const lateralVeins = [
    { t: 0.25, angle: 30, len: W * 0.55 },
    { t: 0.45, angle: 25, len: W * 0.65 },
    { t: 0.65, angle: 20, len: W * 0.50 },
  ];

  // ── STEM OUTLINE ────────────────────────────────
  // Small tapered line at base for connection point
  const stemPath = `
    M 0 0
    L ${(0.5).toFixed(1)} ${(-0.8).toFixed(1)}
    L ${(0.5).toFixed(1)} ${(0.8).toFixed(1)}
    Z
  `;

  // Transform string: translate then rotate
  const transform = `translate(${base.x.toFixed(1)}, ${base.y.toFixed(1)}) rotate(${rotation})`;

  return (
    <G transform={transform} opacity={opacity}>
      <Defs>
        {/* Gradient: dark at base, lighter toward tip */}
        <LinearGradient
          id={gradId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0%" stopColor={palette.leafDark} stopOpacity="0.3" />
          <Stop offset="35%" stopColor={palette.leaf} stopOpacity="1" />
          <Stop offset="100%" stopColor={palette.leafDark} stopOpacity="0.15" />
        </LinearGradient>

        {/* Soft shadow filter definition */}
        <LinearGradient
          id={shadowId}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <Stop offset="0%" stopColor={palette.leafDark} stopOpacity="0.08" />
          <Stop offset="50%" stopColor={palette.leafDark} stopOpacity="0.04" />
          <Stop offset="100%" stopColor={palette.leafDark} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* 1. Soft drop shadow for depth */}
      <Path
        d={shadowPath}
        fill={palette.leafDark}
        opacity={0.12}
      />

      {/* 2. Leaf body with gradient */}
      <Path
        d={leafPath}
        fill={`url(#${gradId})`}
        stroke={palette.leafDark}
        strokeWidth={0.35}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 3. Midrib vein (main structural vein) */}
      <Line
        x1={0}
        y1={0}
        x2={midribX}
        y2={0}
        stroke={palette.leafVein}
        strokeWidth={0.5}
        strokeLinecap="round"
        opacity={0.75}
      />

      {/* 4. Lateral veins (branching structure) */}
      {lateralVeins.map((vein, i) => {
        const vx = midribX * vein.t;
        const rad = vein.angle * (Math.PI / 180);
        const endX = vx + Math.cos(rad) * vein.len;
        const endY = Math.sin(rad) * vein.len;
        return (
          <Line
            key={i}
            x1={vx}
            y1={0}
            x2={endX}
            y2={endY}
            stroke={palette.leafVein}
            strokeWidth={0.3}
            strokeLinecap="round"
            opacity={0.5}
          />
        );
      })}

      {/* 5. Upper edge highlight for luminosity */}
      <Path
        d={leafPath}
        fill="none"
        stroke={palette.leaf}
        strokeWidth={0.2}
        opacity={0.3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 6. Stem base connection point */}
      <Path
        d={stemPath}
        fill={palette.stem}
        opacity={0.4}
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
        <Leaf key={i} leaf={leaf} palette={palette} index={i} />
      ))}
    </>
  );
}
