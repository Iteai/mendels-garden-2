// ─────────────────────────────────────────────
// src/components/ui/SeedCompareModal.tsx
// Side-by-side seed comparison with highlighted differences
// ─────────────────────────────────────────────

import React from 'react';
import {
  View,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Badge } from './Badge';
import { Card } from './Card';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import type { SeedItem } from '../../types';
import { getVariety } from '../../genetics/varieties';

// ─── Helpers ──────────────────────────────────

function varietyName(varietyId: string | undefined): string {
  if (!varietyId) return '';
  try {
    return getVariety(varietyId).displayName;
  } catch {
    return '';
  }
}

function speciesLabel(id: string): string {
  const map: Record<string, string> = {
    tomato: 'Tomato', chili: 'Chili', basil: 'Basil', radish: 'Radish',
  };
  return map[id] ?? id;
}

function formatTrait(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function traitValue(seed: SeedItem, trait: string): number {
  return (seed.phenotype as Record<string, number>)[trait] ?? 0;
}

function formatValue(trait: string, value: number): string {
  if (trait.includes('ColorShift')) {
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  }
  if (trait === 'yieldMultiplier') {
    return `${value.toFixed(1)}×`;
  }
  return `${Math.round(value * 100)}%`;
}

// Traits worth comparing
const COMPARE_TRAITS = [
  'growthRate', 'heightFactor', 'fruitSize', 'fruitCount',
  'yieldMultiplier', 'waterEfficiency', 'lightEfficiency',
  'hardiness', 'seedViability', 'primaryColorShift',
  'saturationBoost',
];

// ─── Props ────────────────────────────────────

type SeedCompareModalProps = {
  visible: boolean;
  seedA: SeedItem;
  seedB: SeedItem;
  onClose: () => void;
};

// ─── Trait diff row ───────────────────────────

function DiffRow({ trait, valA, valB }: { trait: string; valA: number; valB: number }) {
  const diff = valA - valB;
  const absDiff = Math.abs(diff);
  const threshold = 0.08; // minimum difference to highlight

  const isSignificant = absDiff > threshold;
  const aHigher = diff > 0;

  const barMax = trait === 'yieldMultiplier' ? 2 : 1;
  const pctA = valA / barMax;
  const pctB = valB / barMax;

  return (
    <View style={diffStyles.row}>
      <AppText variant="label" color="muted" style={diffStyles.label}>
        {formatTrait(trait).toUpperCase().slice(0, 6)}
      </AppText>

      {/* Value A */}
      <View style={diffStyles.valueCol}>
        <View style={diffStyles.barTrack}>
          <View style={[diffStyles.barFill, { width: `${pctA * 100}%` }]} />
        </View>
        <AppText
          variant="mono"
          style={[
            diffStyles.valText,
            {
              color: isSignificant && aHigher
                ? COLORS.status_thriving
                : isSignificant
                  ? COLORS.text_secondary
                  : COLORS.text_muted,
            },
          ]}
        >
          {formatValue(trait, valA)}
        </AppText>
      </View>

      {/* Difference indicator */}
      {isSignificant && (
        <Ionicons
          name={aHigher ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={aHigher ? COLORS.status_thriving : COLORS.status_wilting}
        />
      )}
      {!isSignificant && (
        <Ionicons name="remove" size={12} color={COLORS.text_muted} />
      )}

      {/* Value B */}
      <View style={diffStyles.valueCol}>
        <View style={diffStyles.barTrack}>
          <View style={[diffStyles.barFill, { width: `${pctB * 100}%` }]} />
        </View>
        <AppText
          variant="mono"
          style={[
            diffStyles.valText,
            {
              color: isSignificant && !aHigher
                ? COLORS.status_thriving
                : isSignificant
                  ? COLORS.text_secondary
                  : COLORS.text_muted,
            },
          ]}
        >
          {formatValue(trait, valB)}
        </AppText>
      </View>
    </View>
  );
}

const diffStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
    marginBottom: SPACING['2'],
  },
  label: {
    width: 40,
    fontSize: 8,
    flexShrink: 0,
  },
  valueCol: {
    flex: 1,
    gap: 2,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.bg_overlay,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.green_primary,
    borderRadius: RADIUS.full,
  },
  valText: {
    fontSize: 9,
    textAlign: 'center',
  },
});

// ─── Component ────────────────────────────────

export function SeedCompareModal({ visible, seedA, seedB, onClose }: SeedCompareModalProps) {
  const isCrossSpecies = seedA.speciesId !== seedB.speciesId;
  const genDiff = seedA.generation - seedB.generation;
  const rarityDiff = seedA.phenotype.rarityScore - seedB.phenotype.rarityScore;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Header */}
        <View style={styles.header}>
          <AppText variant="heading" color="primary">Seed Comparison</AppText>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text_secondary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Seed identity row */}
          <View style={styles.identityRow}>
            {/* Seed A */}
            <Card variant="raised" padded={false} style={styles.seedCard}>
              <View style={styles.seedCardContent}>
                <AppText variant="subheading" color="primary" numberOfLines={1}>
                  {varietyName(seedA.varietyId) || speciesLabel(seedA.speciesId)}
                </AppText>
                <AppText variant="caption" color="muted">{speciesLabel(seedA.speciesId)}</AppText>
                <Badge variant={seedA.rarity} size="sm" />
                <AppText variant="label" color="muted">Gen {seedA.generation}</AppText>
              </View>
            </Card>

            <AppText style={styles.vsText}>VS</AppText>

            {/* Seed B */}
            <Card variant="raised" padded={false} style={styles.seedCard}>
              <View style={styles.seedCardContent}>
                <AppText variant="subheading" color="primary" numberOfLines={1}>
                  {varietyName(seedB.varietyId) || speciesLabel(seedB.speciesId)}
                </AppText>
                <AppText variant="caption" color="muted">{speciesLabel(seedB.speciesId)}</AppText>
                <Badge variant={seedB.rarity} size="sm" />
                <AppText variant="label" color="muted">Gen {seedB.generation}</AppText>
              </View>
            </Card>
          </View>

          {/* Quick stats */}
          <Card variant="inset" style={styles.section}>
            <AppText variant="label" color="muted" style={styles.sectionLabel}>
              Quick Comparison
            </AppText>
            <View style={styles.quickRow}>
              <QuickStat label="Generation" valA={seedA.generation} valB={seedB.generation} format="num" />
              <QuickStat label="Rarity" valA={seedA.phenotype.rarityScore} valB={seedB.phenotype.rarityScore} format="pct" />
              <QuickStat label="Same species" valA={isCrossSpecies ? 0 : 1} valB={isCrossSpecies ? 0 : 1} format="bool" />
            </View>
          </Card>

          {/* Trait-by-trait comparison */}
          <Card variant="default" style={styles.section}>
            <AppText variant="label" color="muted" style={styles.sectionLabel}>
              Trait Comparison
            </AppText>
            <AppText variant="caption" color="muted" style={styles.hint}>
              Green = higher value · Differences over 8% are highlighted
            </AppText>
            {COMPARE_TRAITS.map((trait) => (
              <DiffRow
                key={trait}
                trait={trait}
                valA={traitValue(seedA, trait)}
                valB={traitValue(seedB, trait)}
              />
            ))}
          </Card>

          {/* Genotype comparison */}
          <Card variant="inset" style={styles.section}>
            <AppText variant="label" color="muted" style={styles.sectionLabel}>
              Genotype
            </AppText>
            <View style={styles.genRow}>
              <AppText variant="mono" style={styles.genA} numberOfLines={1}>
                A: {describeGenotypeBrief(seedA.genotype)}
              </AppText>
            </View>
            <View style={styles.genRow}>
              <AppText variant="mono" style={styles.genB} numberOfLines={1}>
                B: {describeGenotypeBrief(seedB.genotype)}
              </AppText>
            </View>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Helper for showing condensed genotype
function describeGenotypeBrief(genotype: Record<string, [string, string]>): string {
  return Object.entries(genotype)
    .slice(0, 5)
    .map(([key, pair]) => {
      const [a, b] = pair;
      if (a === 'D' && b === 'D') return `${key.slice(0, 3)}:DD`;
      if (a === 'R' && b === 'R') return `${key.slice(0, 3)}:RR`;
      return `${key.slice(0, 3)}:DR`;
    })
    .join(' · ');
}

// ─── Quick Stat ───────────────────────────────

type QuickStatProps = {
  label: string;
  valA: number;
  valB: number;
  format: 'num' | 'pct' | 'bool';
};

function QuickStat({ label, valA, valB, format }: QuickStatProps) {
  const displayA = format === 'pct' ? `${Math.round(valA * 100)}%`
    : format === 'bool' ? (valA > 0 ? 'Same' : 'Cross')
    : `${valA}`;
  const displayB = format === 'pct' ? `${Math.round(valB * 100)}%`
    : format === 'bool' ? (valB > 0 ? 'Same' : 'Cross')
    : `${valB}`;
  const equal = valA === valB;
  const eqColor = equal ? COLORS.text_muted : COLORS.text_accent;

  return (
    <View style={quickStyles.col}>
      <AppText variant="label" color="muted" style={quickStyles.label}>{label}</AppText>
      <AppText variant="mono" style={[quickStyles.val, { color: eqColor }]}>{displayA}</AppText>
      <AppText variant="mono" style={[quickStyles.val, { color: eqColor }]}>{displayB}</AppText>
    </View>
  );
}

const quickStyles = StyleSheet.create({
  col: { flex: 1, alignItems: 'center', gap: SPACING['1'] },
  label: { fontSize: 8 },
  val: { fontSize: 12 },
});

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg_primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING['5'],
    paddingTop: SPACING['5'],
    paddingBottom: SPACING['3'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
  },
  closeBtn: {
    padding: SPACING['2'],
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING['5'],
    gap: SPACING['4'],
    paddingBottom: SPACING['10'],
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
  },
  seedCard: {
    flex: 1,
  },
  seedCardContent: {
    padding: SPACING['3'],
    alignItems: 'center',
    gap: SPACING['1'],
  },
  vsText: {
    fontSize: 14,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text_accent,
  },
  section: {},
  sectionLabel: {
    marginBottom: SPACING['2'],
  },
  hint: {
    marginBottom: SPACING['3'],
    lineHeight: 16,
  },
  quickRow: {
    flexDirection: 'row',
    gap: SPACING['2'],
  },
  genRow: {
    marginBottom: SPACING['1'],
  },
  genA: {
    fontSize: 10,
    color: COLORS.text_accent,
    letterSpacing: 1,
  },
  genB: {
    fontSize: 10,
    color: COLORS.rarity_rare,
    letterSpacing: 1,
  },
});