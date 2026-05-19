// ─────────────────────────────────────────────
// src/components/ui/StatBar.tsx
// Thin resource/stat bar (water, nutrients, health)
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import { AppText } from './AppText';

type StatBarProps = {
  label: string;
  value: number;      // 0–1
  color?: string;
  showValue?: boolean;
  compact?: boolean;
};

function valueToColor(value: number, baseColor?: string): string {
  if (baseColor) return baseColor;
  if (value >= 0.7) return COLORS.status_thriving;
  if (value >= 0.45) return COLORS.status_stressed;
  return COLORS.status_dying;
}

export function StatBar({
  label,
  value,
  color,
  showValue = true,
  compact = false,
}: StatBarProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const barColor = valueToColor(clamped, color);

  return (
    <View style={[styles.container, compact && styles.compact]}>
      <View style={styles.labelRow}>
        <AppText variant="label" color="muted">
          {label}
        </AppText>
        {showValue && (
          <AppText variant="mono" style={[styles.valueText, { color: barColor }]}>
            {Math.round(clamped * 100)}%
          </AppText>
        )}
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped * 100}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING['1'],
    marginBottom: SPACING['2'],
  },
  compact: {
    marginBottom: SPACING['1'],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  track: {
    height: 4,
    backgroundColor: COLORS.bg_overlay,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  valueText: {
    fontSize: 10,
  },
});
