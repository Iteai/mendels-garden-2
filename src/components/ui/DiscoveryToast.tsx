// ─────────────────────────────────────────────
// src/components/ui/DiscoveryToast.tsx
// Animated toast notification for new variety discoveries
// ─────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { getVariety } from '../../genetics/varieties';
import type { VarietyId, SpeciesId } from '../../types';

// ─── Species emoji map ────────────────────────

function speciesEmoji(speciesId: string): string {
  const map: Record<string, string> = {
    tomato: '🍅',
    chili: '🌶️',
    basil: '🌿',
    radish: '🌱',
  };
  return map[speciesId] ?? '🌱';
}

// ─── Props ────────────────────────────────────

export type DiscoveryToastData = {
  varietyId: VarietyId;
  speciesId: SpeciesId;
  rarityScore: number;
};

type DiscoveryToastProps = {
  data: DiscoveryToastData | null;
  onDismiss: () => void;
  autoHideMs?: number;
};

// ─── Component ────────────────────────────────

export function DiscoveryToast({ data, onDismiss, autoHideMs = 3500 }: DiscoveryToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<DiscoveryToastData | null>(null);

  useEffect(() => {
    if (data) {
      setCurrent(data);
      setVisible(true);

      // Animate in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoHideMs);

      return () => clearTimeout(timer);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setCurrent(null);
      onDismiss();
    });
  };

  if (!visible || !current) return null;

  const vari = (() => {
    try { return getVariety(current.varietyId); }
    catch { return null; }
  })();

  const label = vari?.displayName ?? current.varietyId;
  const emoji = speciesEmoji(current.speciesId);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ scale }] },
      ]}
    >
      <Pressable style={styles.content} onPress={handleDismiss}>
        {/* Left accent */}
        <View style={styles.accent} />

        {/* Emoji */}
        <AppText style={styles.emoji}>{emoji}</AppText>

        {/* Text */}
        <View style={styles.textCol}>
          <AppText variant="subheading" color="accent">
            New Discovery!
          </AppText>
          <AppText variant="body" color="primary" numberOfLines={1}>
            {label}
          </AppText>
          <AppText variant="caption" color="muted">
            Added to your collection journal
          </AppText>
        </View>

        {/* Rarity badge */}
        <Badge
          variant={
            current.rarityScore >= 0.85 ? 'legendary' :
            current.rarityScore >= 0.60 ? 'rare' :
            current.rarityScore >= 0.30 ? 'uncommon' :
            'common'
          }
          size="sm"
        />

        {/* Close hint */}
        <Ionicons name="chevron-forward" size={14} color={COLORS.text_muted} />
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: SPACING['4'],
    right: SPACING['4'],
    zIndex: 9999,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
    backgroundColor: COLORS.bg_raised,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.green_bright,
    paddingVertical: SPACING['3'],
    paddingRight: SPACING['3'],
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.green_bright,
  },
  emoji: {
    fontSize: 28,
    paddingLeft: SPACING['2'],
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
});