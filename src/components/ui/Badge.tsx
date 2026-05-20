// ─────────────────────────────────────────────
// src/components/ui/Badge.tsx
// Rarity & status badge pill
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { AppText } from './AppText';
import type { SeedRarity, PlantHealth, GrowthStage } from '../../types';

type BadgeVariant =
  | SeedRarity
  | PlantHealth
  | GrowthStage
  | 'info'
  | 'neutral';

const VARIANT_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  // Rarity
  common:    { bg: '#1C2414', text: COLORS.rarity_common,    border: COLORS.rarity_common },
  uncommon:  { bg: '#142014', text: COLORS.rarity_uncommon,  border: COLORS.rarity_uncommon },
  rare:      { bg: '#141820', text: COLORS.rarity_rare,      border: COLORS.rarity_rare },
  legendary: { bg: '#201A0E', text: COLORS.rarity_legendary, border: COLORS.rarity_legendary },

  // Health
  thriving: { bg: '#142014', text: COLORS.status_thriving, border: COLORS.status_thriving },
  healthy:  { bg: '#1A2214', text: COLORS.status_healthy,  border: COLORS.status_healthy },
  stressed: { bg: '#201C0E', text: COLORS.status_stressed, border: COLORS.status_stressed },
  wilting:  { bg: '#201408', text: COLORS.status_wilting,  border: COLORS.status_wilting },
  dying:    { bg: '#200C08', text: COLORS.status_dying,    border: COLORS.status_dying },

  // Growth stages
  seed:          { bg: '#1A1810', text: COLORS.soil_light,    border: COLORS.soil_mid },
  sprout:        { bg: '#141E0E', text: COLORS.green_pale,    border: COLORS.green_muted },
  vegetative:    { bg: '#142014', text: COLORS.green_primary, border: COLORS.green_deep },
  flowering:     { bg: '#1A1420', text: COLORS.terra_pale,    border: COLORS.terra_primary },
  mature:        { bg: '#141A10', text: COLORS.green_bright,  border: COLORS.green_primary },
  harvest_ready: { bg: '#1A1C0A', text: COLORS.text_accent,   border: COLORS.green_bright },
  decaying:      { bg: '#18140A', text: COLORS.soil_light,    border: COLORS.soil_mid },
  dead:          { bg: '#141414', text: COLORS.text_muted,    border: COLORS.border_subtle },

  // Generic
  info:    { bg: '#141820', text: COLORS.rarity_rare,    border: COLORS.rarity_rare },
  neutral: { bg: '#1C2214', text: COLORS.text_muted,     border: COLORS.border_normal },
};

type BadgeProps = {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
};

export function Badge({ variant, label, size = 'md' }: BadgeProps) {
  const styles_v = VARIANT_STYLES[variant] ?? VARIANT_STYLES.neutral;
  const displayLabel = label ?? variant.replace('_', ' ');

  return (
    <View
      style={[
        styles.base,
        size === 'sm' && styles.small,
        {
          backgroundColor: styles_v.bg,
          borderColor: styles_v.border,
        },
      ]}
    >
      <AppText
        variant="label"
        style={[
          { color: styles_v.text },
          size === 'sm' && { fontSize: TYPOGRAPHY.size.xs - 1 },
        ]}
      >
        {displayLabel}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING['2'],
    paddingVertical: SPACING.px * 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  small: {
    paddingHorizontal: SPACING['1'],
    paddingVertical: SPACING.px * 2,
  },
});
