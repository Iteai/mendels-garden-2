// ─────────────────────────────────────────────
// src/components/ui/GrowthRing.tsx
// Mini circular progress ring for garden plot cells
// Shows growth progress within the current stage
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';

type GrowthRingProps = {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
};

/**
 * Simple mini ring that visualizes growth progress.
 * Uses a clipped square approach rather than SVG for performance.
 * The filling square rotates to show progress.
 */
export function GrowthRing({
  progress,
  size = 16,
  strokeWidth = 2,
  color,
  trackColor,
}: GrowthRingProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const halfSize = size / 2;
  const innerSize = size - strokeWidth * 2;

  // Determine color based on progress
  const ringColor = color ?? (
    clampedProgress >= 0.85 ? COLORS.status_thriving :
    clampedProgress >= 0.50 ? COLORS.status_stressed :
    COLORS.text_muted
  );
  const bgColor = trackColor ?? COLORS.bg_overlay;

  // Simple approach: a circle with a clipped overlay
  // The filled arc is represented by rotating view
  const rotation = clampedProgress * 360;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: halfSize,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          },
        ]}
      />
      {/* Progress arc — a half-circle clipped approach */}
      <View style={[styles.progressWrap, { width: size, height: size }]}>
        <View
          style={[
            styles.fill,
            {
              width: halfSize,
              height: size,
              borderRadius: 0,
              overflow: 'hidden',
            },
          ]}
        >
          <View
            style={[
              styles.half,
              {
                width: halfSize,
                height: size,
                borderRadius: halfSize,
                borderWidth: strokeWidth,
                borderColor: ringColor,
                transform: [{ rotate: `${rotation - 180}deg` }],
                left: 0,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    position: 'absolute',
  },
  progressWrap: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  half: {
    position: 'absolute',
    top: 0,
  },
});