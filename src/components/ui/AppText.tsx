// ─────────────────────────────────────────────
// src/components/ui/AppText.tsx
// Typography component — consistent text styles
// ─────────────────────────────────────────────

import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

type TextVariant =
  | 'display'      // Large screen titles
  | 'heading'      // Section headings
  | 'subheading'   // Subsection labels
  | 'body'         // Body copy
  | 'caption'      // Small descriptors
  | 'mono'         // Monospace data / stats
  | 'label'        // UI labels (uppercase tracking)
  | 'stat';        // Numeric values

type TextColor = 'primary' | 'secondary' | 'muted' | 'accent' | 'terra' | 'green';

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
};

const variantStyles: Record<TextVariant, object> = {
  display: {
    fontSize: TYPOGRAPHY.size['3xl'],
    fontWeight: TYPOGRAPHY.weight.black,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    lineHeight: TYPOGRAPHY.size['3xl'] * TYPOGRAPHY.lineHeight.tight,
  },
  heading: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
    lineHeight: TYPOGRAPHY.size['2xl'] * TYPOGRAPHY.lineHeight.tight,
  },
  subheading: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.semibold,
    lineHeight: TYPOGRAPHY.size.xl * TYPOGRAPHY.lineHeight.normal,
  },
  body: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.regular,
    lineHeight: TYPOGRAPHY.size.base * TYPOGRAPHY.lineHeight.relaxed,
  },
  caption: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.regular,
    lineHeight: TYPOGRAPHY.size.sm * TYPOGRAPHY.lineHeight.normal,
  },
  mono: {
    fontSize: TYPOGRAPHY.size.base,
    fontWeight: TYPOGRAPHY.weight.regular,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    lineHeight: TYPOGRAPHY.size.base * TYPOGRAPHY.lineHeight.normal,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    letterSpacing: TYPOGRAPHY.letterSpacing.widest,
    textTransform: 'uppercase',
  },
  stat: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.black,
    fontFamily: TYPOGRAPHY.fontFamily.mono,
    letterSpacing: TYPOGRAPHY.letterSpacing.tight,
  },
};

const colorMap: Record<TextColor, string> = {
  primary:   COLORS.text_primary,
  secondary: COLORS.text_secondary,
  muted:     COLORS.text_muted,
  accent:    COLORS.text_accent,
  terra:     COLORS.terra_primary,
  green:     COLORS.green_bright,
};

export function AppText({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text
      style={[
        variantStyles[variant],
        { color: colorMap[color] },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
