// ─────────────────────────────────────────────
// src/components/ui/Card.tsx
// Surface card with botanical border treatment
// ─────────────────────────────────────────────

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

type CardVariant = 'default' | 'raised' | 'inset' | 'highlight';

type CardProps = ViewProps & {
  variant?: CardVariant;
  children: React.ReactNode;
  padded?: boolean;
};

const variantStyles: Record<CardVariant, object> = {
  default: {
    backgroundColor: COLORS.bg_surface,
    borderColor: COLORS.border_subtle,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  raised: {
    backgroundColor: COLORS.bg_raised,
    borderColor: COLORS.border_normal,
    borderWidth: 1,
    ...SHADOWS.md,
  },
  inset: {
    backgroundColor: COLORS.bg_primary,
    borderColor: COLORS.border_subtle,
    borderWidth: 1,
  },
  highlight: {
    backgroundColor: COLORS.bg_surface,
    borderColor: COLORS.green_deep,
    borderWidth: 1,
    ...SHADOWS.glow_green,
  },
};

export function Card({
  variant = 'default',
  padded = true,
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        padded && styles.padded,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  padded: {
    padding: SPACING['4'],
  },
});
