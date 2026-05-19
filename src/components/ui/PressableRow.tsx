// ─────────────────────────────────────────────
// src/components/ui/PressableRow.tsx
// Touchable row item with press state feedback
// ─────────────────────────────────────────────

import React from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  PressableProps,
} from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

type PressableRowProps = PressableProps & {
  children: React.ReactNode;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

export function PressableRow({
  children,
  leftSlot,
  rightSlot,
  style,
  ...props
}: PressableRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {leftSlot && <View style={styles.leftSlot}>{leftSlot}</View>}
      <View style={styles.content}>{children}</View>
      {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    paddingVertical: SPACING['3'],
    paddingHorizontal: SPACING['4'],
    marginBottom: SPACING['2'],
  },
  pressed: {
    backgroundColor: COLORS.bg_raised,
    borderColor: COLORS.border_normal,
  },
  content: {
    flex: 1,
  },
  leftSlot: {
    marginRight: SPACING['3'],
  },
  rightSlot: {
    marginLeft: SPACING['3'],
  },
});
