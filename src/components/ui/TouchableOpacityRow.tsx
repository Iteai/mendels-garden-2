import React from 'react';
import { TouchableOpacity, View, StyleSheet, TouchableOpacityProps } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';

type TouchableOpacityRowProps = TouchableOpacityProps & {
  children: React.ReactNode;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

export function TouchableOpacityRow({ children, leftSlot, rightSlot, style, ...props }: TouchableOpacityRowProps) {
  return (
    <TouchableOpacity
      style={({ pressed }) => [styles.container, pressed && styles.pressed, typeof style === 'function' ? style({ pressed }) : style]}
      activeOpacity={0.7}
      {...props}
    >
      {leftSlot && <View style={styles.leftSlot}>{leftSlot}</View>}
      <View style={styles.content}>{children}</View>
      {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
    </TouchableOpacity>
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
  pressed: { backgroundColor: COLORS.bg_raised, borderColor: COLORS.border_normal },
  content: { flex: 1 },
  leftSlot: { marginRight: SPACING['3'] },
  rightSlot: { marginLeft: SPACING['3'] },
});