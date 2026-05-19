// ─────────────────────────────────────────────
// src/components/ui/HarvestResultModal.tsx
// Shows harvest outcome: yield, seeds extracted, currency earned
// Phase 5: Game Loop — Harvest Result UI
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { Card } from './Card';
import type { HarvestResult } from '../../store/inventoryStore';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

type HarvestResultModalProps = {
  visible: boolean;
  result: HarvestResult | null;
  speciesLabel: string;
  onClose: () => void;
};

export function HarvestResultModal({
  visible, result, speciesLabel, onClose,
}: HarvestResultModalProps) {
  if (!result) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Ionicons name="basket" size={28} color={COLORS.green_bright} />
            <AppText variant="heading" color="accent">Harvest Complete!</AppText>
          </View>

          {/* Stats */}
          <Card variant="inset" style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statIconBox}>
                <Ionicons name="basket-outline" size={16} color={COLORS.green_primary} />
              </View>
              <AppText variant="body" color="primary" style={styles.statLabel}>
                {speciesLabel} Yield
              </AppText>
              <AppText variant="mono" color="accent" style={styles.statValue}>
                ×{result.harvestId ? '✓' : '—'}
              </AppText>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statIconBox}>
                <Ionicons name="leaf" size={16} color={COLORS.text_accent} />
              </View>
              <AppText variant="body" color="primary" style={styles.statLabel}>
                Seeds Extracted
              </AppText>
              <AppText variant="mono" color="accent" style={styles.statValue}>
                ×{result.totalSeedsExtracted}
              </AppText>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statIconBox}>
                <Ionicons name="sparkles" size={16} color={COLORS.rarity_legendary} />
              </View>
              <AppText variant="body" color="primary" style={styles.statLabel}>
                Spores Earned
              </AppText>
              <AppText variant="mono" color="accent" style={styles.statValue}>
                +{result.currencyEarned} ✦
              </AppText>
            </View>
          </Card>

          {/* Description */}
          <AppText variant="caption" color="muted" style={styles.note}>
            Seeds from this harvest retain the parent plant's genetics,
            including any rare traits. Use them to breed new variants
            in the Lab.
          </AppText>

          {/* Close button */}
          <Pressable
            style={({ pressed }) => [
              styles.doneBtn,
              pressed && styles.doneBtnPressed,
            ]}
            onPress={onClose}
          >
            <AppText variant="label" color="accent">Continue</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bg_surface,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    borderTopWidth: 1,
    borderColor: COLORS.green_deep,
    padding: SPACING['6'],
    gap: SPACING['4'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
  },
  statsCard: {
    gap: SPACING['3'],
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg_deep,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statLabel: {
    flex: 1,
  },
  statValue: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  note: {
    lineHeight: 20,
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: SPACING['3'],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.green_deep,
    backgroundColor: COLORS.bg_overlay,
  },
  doneBtnPressed: {
    backgroundColor: COLORS.bg_raised,
  },
});