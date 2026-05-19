// ─────────────────────────────────────────────
// src/components/plants/parts/Stem.tsx
// Professional botanical stem with gradient shading,
// depth shadows, subtle branching detail, and realistic
// texture. Uses layered rendering for volume effect.
// ─────────────────────────────────────────────

import React from 'react';
import { Defs, G, Path, Circle, LinearGradient, Stop } from 'react-native-svg';
import type { StemGeometry, BranchGeometry, PlantColorPalette } from '../types';

type StemProps = {
  stem: StemGeometry;
  branches: BranchGeometry[];
  palette: PlantColorPalette;
  opacity?: number;
};

export function Stem({ stem, branches, palette, opacity = 1 }: StemProps) {
  const { base, apex, control, width } = stem;

  // ── GRADIENT DEFINITIONS ────────────────────

  // Main stem gradient: darker at base, lighter higher up
  const stemGradId = 'stemGrad_main';

  // Shadow gradient for depth effect
  const shadowGradId = 'stemShadow';

  // ── MAIN STEM PATH ────────────────────────

  const stemPath =
    `M ${base.x.toFixed(1)} ${base.y.toFixed(1)} ` +
    `Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ` +
    `${apex.x.toFixed(1)} ${apex.y.toFixed(1)}`;

  // ── RENDERING ──────────────────────────────

  return (
    <G opacity={opacity}>
      <Defs>
        {/* Main stem color gradient */}
        <LinearGradient
          id={stemGradId}
          x1={`${base.x}%`}
          y1={`${base.y}%`}
          x2={`${apex.x}%`}
          y2={`${apex.y}%`}
          gradientUnits="userSpaceOnUse"
        >
          {/* Base: darker, more saturated */}
          <Stop offset="0%" stopColor={palette.stemDark} stopOpacity="1" />
          {/* Mid: transition to main stem color */}
          <Stop offset="40%" stopColor={palette.stem} stopOpacity="0.95" />
          {/* Tip: slightly lighter for illumination */}
          <Stop offset="100%" stopColor={palette.stemDark} stopOpacity="0.7" />
        </LinearGradient>

        {/* Soft shadow for depth */}
        <LinearGradient
          id={shadowGradId}
          x1={`${base.x}%`}
          y1={`${base.y}%`}
          x2={`${apex.x}%`}
          y2={`${apex.y}%`}
        >
          <Stop offset="0%" stopColor={palette.stemDark} stopOpacity="0.2" />
          <Stop offset="100%" stopColor={palette.stemDark} stopOpacity="0.08" />
        </LinearGradient>
      </Defs>

      {/* 1. Soft drop shadow for depth */}
      <Path
        d={stemPath}
        stroke={palette.stemDark}
        strokeWidth={width + 1.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.15}
      />

      {/* 2. Main stem with gradient */}
      <Path
        d={stemPath}
        stroke={`url(#${stemGradId})`}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
      />

      {/* 3. Upper highlight line for cylindrical illusion */}
      <Path
        d={stemPath}
        stroke={palette.leaf}
        strokeWidth={width * 0.25}
        strokeLinecap="round"
        fill="none"
        opacity={0.25}
      />

      {/* 4. Branches ────────────────────────────────── */}
      {branches.map((br, i) => {
        const { node, end, control: brCtrl, width: bw } = br;

        const branchPath =
          `M ${node.x.toFixed(1)} ${node.y.toFixed(1)} ` +
          `Q ${brCtrl.x.toFixed(1)} ${brCtrl.y.toFixed(1)} ` +
          `${end.x.toFixed(1)} ${end.y.toFixed(1)}`;

        return (
          <G key={i}>
            {/* Branch shadow */}
            <Path
              d={branchPath}
              stroke={palette.stemDark}
              strokeWidth={bw + 0.6}
              strokeLinecap="round"
              fill="none"
              opacity={0.12}
            />
            {/* Branch main */}
            <Path
              d={branchPath}
              stroke={palette.stem}
              strokeWidth={bw}
              strokeLinecap="round"
              fill="none"
              opacity={0.88}
            />
            {/* Branch highlight */}
            <Path
              d={branchPath}
              stroke={palette.leaf}
              strokeWidth={bw * 0.2}
              strokeLinecap="round"
              fill="none"
              opacity={0.15}
            />
          </G>
        );
      })}

      {/* 5. Node details — botanical branching points ────────────── */}
      {/* Nodes where branches attach — add subtle swelling */}
      {branches
        .filter((_, i) => i % 2 === 0) // one dot per pair
        .map((br, i) => (
          <G key={`node-${i}`}>
            {/* Node shadow */}
            <Circle
              cx={br.node.x + 0.1}
              cy={br.node.y + 0.1}
              r={width * 0.65}
              fill={palette.stemDark}
              opacity={0.25}
            />
            {/* Node highlight */}
            <Circle
              cx={br.node.x}
              cy={br.node.y}
              r={width * 0.60}
              fill={palette.stemDark}
              opacity={0.7}
            />
            {/* Node edge light */}
            <Circle
              cx={br.node.x}
              cy={br.node.y - width * 0.35}
              r={width * 0.25}
              fill={palette.stem}
              opacity={0.3}
            />
          </G>
        ))}

      {/* 6. Base soil attachment ────────────────────────── */}
      {/* Visual anchor point at soil line */}
      <G>
        <Circle
          cx={base.x}
          cy={base.y + 1}
          r={width + 0.5}
          fill={palette.stemDark}
          opacity={0.4}
        />
        <Circle
          cx={base.x}
          cy={base.y}
          r={width * 0.8}
          fill={palette.stem}
          opacity={0.6}
        />
      </G>
    </G>
  );
}