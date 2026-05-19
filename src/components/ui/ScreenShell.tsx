// ─────────────────────────────────────────────
// src/components/ui/ScreenShell.tsx
// Safe-area aware screen wrapper with top header
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { AppText } from './AppText';
import { useCurrency } from '../../store';

type ScreenShellProps = {
  title: string;
  subtitle?: string;
  scrollable?: boolean;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  contentStyle?: ViewStyle;
};

function CurrencyDisplay() {
  const currency = useCurrency();
  return (
    <View style={styles.currencyPill}>
      <AppText variant="mono" color="accent" style={styles.currencyText}>
        ✦ {currency}
      </AppText>
    </View>
  );
}

export function ScreenShell({
  title,
  subtitle,
  scrollable = true,
  children,
  headerRight,
  contentStyle,
}: ScreenShellProps) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AppText variant="heading" color="primary">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="muted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          <CurrencyDisplay />
          {headerRight}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Body */}
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{content}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg_primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING['5'],
    paddingTop: SPACING['4'],
    paddingBottom: SPACING['3'],
  },
  headerLeft: {
    flex: 1,
    gap: SPACING['1'],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
  },
  subtitle: {
    marginTop: SPACING['1'],
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border_subtle,
    marginHorizontal: SPACING['5'],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING['5'],
    paddingTop: SPACING['4'],
    paddingBottom: SPACING['10'],
  },
  fill: {
    flex: 1,
    paddingHorizontal: SPACING['5'],
    paddingTop: SPACING['4'],
  },
  currencyPill: {
    backgroundColor: COLORS.bg_surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border_normal,
    paddingHorizontal: SPACING['3'],
    paddingVertical: SPACING['1'],
  },
  currencyText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
});
