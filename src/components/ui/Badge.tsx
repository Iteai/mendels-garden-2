// ─────────────────────────────────────────────
// src/components/ui/Badge.tsx
// Premium rarity & status badge with sophisticated
// color coding, visual polish, and indie game aesthetic
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
  // Rarity — premium color coding
  common:    { bg: '#18191410', text: COLORS.rarity_common,    border: COLORS.rarity_common },
  uncommon:  { bg: '#1a2a1410', text: COLORS.rarity_uncommon,  border: COLORS.rarity_uncommon },
  rare:      { bg: '#14182010', text: COLORS.rarity_rare,      border: COLORS.rarity_rare },
  legendary: { bg: '#24201410', text: COLORS.rarity_legendary, border: COLORS.rarity_legendary },

  // Health — status indicators
  thriving: { bg: '#15281410', text: COLORS.status_thriving, border: COLORS.status_thriving },
  healthy:  { bg: '#1a241410', text: COLORS.status_healthy,  border: COLORS.status_healthy },
  stressed: { bg: '#24211410', text: COLORS.status_stressed, border: COLORS.status_stressed },
  wilting:  { bg: '#24140814', text: COLORS.status_wilting,  border: COLORS.status_wilting },
  dying:    { bg: '#28100814', text: COLORS.status_dying,    border: COLORS.status_dying },

  // Growth stages — lifecycle indicators
  seed:          { bg: '#1e1c1410', text: COLORS.soil_light,    border: COLORS.soil_mid },
  sprout:        { bg: '#15211410', text: COLORS.green_pale,    border: COLORS.green_muted },
  vegetative:    { bg: '#16281410', text: COLORS.green_primary, border: COLORS.green_deep },
  flowering:     { bg: '#1e181410', text: COLORS.terra_pale,    border: COLORS.terra_primary },
  mature:        { bg: '#18201410', text: COLORS.green_bright,  border: COLORS.green_primary },
  harvest_ready: { bg: '#211f0a14', text: COLORS.text_accent,   border: COLORS.green_bright },
  decaying:      { bg: '#1c160a14', text: COLORS.soil_light,    border: COLORS.soil_mid },
  dead:          { bg: '#18181814', text: COLORS.text_muted,    border: COLORS.border_subtle },

  // Generic
  info:    { bg: '#16182014', text: COLORS.rarity_rare,    border: COLORS.rarity_rare },
  neutral: { bg: '#1c251414', text: COLORS.text_muted,     border: COLORS.border_normal },
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
