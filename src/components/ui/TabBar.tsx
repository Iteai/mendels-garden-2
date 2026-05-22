// ─────────────────────────────────────────────
// src/components/ui/TabBar.tsx
// Custom bottom tab bar — botanical field journal style
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../constants/theme';
import { AppText } from './AppText';

// Tab icon map
const TAB_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconActive: keyof typeof Ionicons.glyphMap; label: string }
> = {
  garden: {
    icon:       'leaf-outline',
    iconActive: 'leaf',
    label:      'Garden',
  },
  inventory: {
    icon:       'archive-outline',
    iconActive: 'archive',
    label:      'Seeds',
  },
  lab: {
    icon:       'flask-outline',
    iconActive: 'flask',
    label:      'Lab',
  },
  settings: {
    icon:       'settings-outline',
    iconActive: 'settings',
    label:      'Settings',
  },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACING['2'] }]}>
      {/* Top border with green glow */}
      <View style={styles.topBorder} />

      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] ?? {
            icon:       'ellipse-outline',
            iconActive: 'ellipse',
            label:      route.name,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={config.label}
            >
              {/* Active indicator dot */}
              {isFocused && <View style={styles.activeDot} />}

              {/* Icon */}
              <Ionicons
                name={isFocused ? config.iconActive : config.icon}
                size={22}
                color={isFocused ? COLORS.green_bright : COLORS.text_muted}
              />

              {/* Label */}
              <AppText
                variant="label"
                style={[
                  styles.tabLabel,
                  { color: isFocused ? COLORS.text_accent : COLORS.text_muted },
                ]}
              >
                {config.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bg_deep,
    paddingTop: SPACING['2'],
    paddingHorizontal: SPACING['2'],
  },
  topBorder: {
    height: 1,
    backgroundColor: COLORS.border_normal,
    marginBottom: SPACING['2'],
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['1'],
    paddingVertical: SPACING['2'],
    borderRadius: RADIUS.md,
    position: 'relative',
  },
  tabPressed: {
    backgroundColor: COLORS.bg_surface,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: TYPOGRAPHY.letterSpacing.wide,
  },
  activeDot: {
    position: 'absolute',
    top: 2,
    width: 4,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.green_bright,
  },
});
