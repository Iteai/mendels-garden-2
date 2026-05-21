// ─────────────────────────────────────────────
// src/components/ui/TraitComparison.tsx
// Phase 7 — Side-by-side trait comparison for
//   breeding in the Lab.
//
// Shows Parent A vs Parent B for each key trait,
//   highlighting which parent leads.
// ─────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import type { SeedItem } from '../../types';

const COMPARISON_TRAITS: Array<{
  key: string;
  label: string;
  higherBetter: boolean;
  format: 'pct' | 'mult' | 'shift';
}> = [
  { key: 'growthRate',          label: 'Growth',      higherBetter: true,  format: 'pct' },
  { key: 'heightFactor',        label: 'Height',      higherBetter: false, format: 'pct' },
  { key: 'fruitSize',           label: 'Fruit Size',  higherBetter: true,  format: 'pct' },
  { key: 'fruitCount',          label: 'Fruit Qty',   higherBetter: true,  format: 'pct' },
  { key: 'yieldMultiplier',     label: 'Yield',       higherBetter: true,  format: 'mult' },
  { key: 'waterEfficiency',     label: 'Drought',     higherBetter: true,  format: 'pct' },
  { key: 'lightEfficiency',     label: 'Shade',       higherBetter: true,  format: 'pct' },
  { key: 'hardiness',           label: 'Hardiness',   higherBetter: true,  format: 'pct' },
  { key: 'seedViability',       label: 'Seed Set',    higherBetter: true,  format: 'pct' },
  { key: 'primaryColorShift',   label: 'Colour',      higherBetter: false, format: 'shift' },
];

type TraitComparisonProps = {
  parentA: SeedItem;
  parentB: SeedItem;
};

function getTraitValue(seed: SeedItem, key: string): number {
  return (seed.phenotype as Record<string, number>)[key] ?? 0;
}

function formatValue(key: string, value: number, format: 'pct' | 'mult' | 'shift'): string {
  if (format === 'shift') {
    return value >= 0 ? `+${(value * 100).toFixed(0)}%` : `${(value * 100).toFixed(0)}%`;
  }
  if (format === 'mult') {
    return `${value.toFixed(1)}×`;
  }
  return `${Math.round(value * 100)}%`;
}

function TraitComparisonRow({
  trait,
  valA,
  valB,
}: {
  trait: typeof COMPARISON_TRAITS[0];
  valA: number;
  valB: number;
}) {
  // Normalise values for bar display
  const isColor = trait.key.includes('ColorShift');
  const normA = isColor ? (valA + 1) / 2 : trait.key === 'yieldMultiplier' ? valA / 2 : valA;
  const normB = isColor ? (valB + 1) / 2 : trait.key === 'yieldMultiplier' ? valB / 2 : valB;

  const aLeads = trait.higherBetter ? valA > valB : valA < valB;
  const bLeads = trait.higherBetter ? valB > valA : valB < valA;
  const tied = Math.abs(valA - valB) < 0.01;

  return (
    <View style={rowStyles.container}>
      {/* Label */}
      <AppText variant="label" color="muted" style={rowStyles.label}>
        {trait.label.toUpperCase()}
      </AppText>

      {/* Parent A */}
      <View style={rowStyles.side}>
        <View style={rowStyles.barTrack}>
          <View
            style={[
              rowStyles.barFill,
              {
                width: `${normA * 100}%`,
                backgroundColor: aLeads ? COLORS.green_bright : tied ? COLORS.text_muted : COLORS.terra_primary,
              },
            ]}
          />
        </View>
        <AppText
          variant="mono"
          style={[
            rowStyles.val,
            aLeads && !tied && { color: COLORS.green_bright },
            tied && { color: COLORS.text_secondary },
            !aLeads && !tied && { color: COLORS.terra_primary },
          ]}
        >
          {formatValue(trait.key, valA, trait.format)}
        </AppText>
      </View>

      {/* VS indicator */}
      <AppText variant="label" style={rowStyles.vs}>
        {tied ? '=' : aLeads ? '>' : '<'}
      </AppText>

      {/* Parent B */}
      <View style={rowStyles.side}>
        <View style={rowStyles.barTrack}>
          <View
            style={[
              rowStyles.barFill,
              {
                width: `${normB * 100}%`,
                backgroundColor: bLeads ? COLORS.green_bright : tied ? COLORS.text_muted : COLORS.terra_primary,
              },
            ]}
          />
        </View>
        <AppText
          variant="mono"
          style={[
            rowStyles.val,
            bLeads && !tied && { color: COLORS.green_bright },
            tied && { color: COLORS.text_secondary },
            !bLeads && !tied && { color: COLORS.terra_primary },
          ]}
        >
          {formatValue(trait.key, valB, trait.format)}
        </AppText>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
    marginBottom: SPACING['2'],
  },
  label: {
    width: 52,
    fontSize: 8,
    letterSpacing: 1.2,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['1'],
  },
  barTrack: {
    flex: 1,
    height: 5,
    backgroundColor: COLORS.bg_overlay,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  val: {
    width: 48,
    textAlign: 'right',
    fontSize: 10,
  },
  vs: {
    width: 18,
    textAlign: 'center',
    color: COLORS.text_muted,
    fontSize: 9,
  },
});

// ─── Summary strip ────────────────────────────

function ComparisonSummary({ parentA, parentB }: TraitComparisonProps) {
  let aWins = 0;
  let bWins = 0;
  let ties = 0;

  for (const trait of COMPARISON_TRAITS) {
    const valA = getTraitValue(parentA, trait.key);
    const valB = getTraitValue(parentB, trait.key);
    const diff = Math.abs(valA - valB);
    if (diff < 0.01) {
      ties++;
    } else if (trait.higherBetter) {
      if (valA > valB) aWins++;
      else bWins++;
    } else {
      if (valA < valB) aWins++;
      else bWins++;
    }
  }

  return (
    <View style={summaryStyles.container}>
      <View style={summaryStyles.item}>
        <AppText variant="mono" style={[summaryStyles.count, { color: COLORS.green_bright }]}>
          {aWins}
        </AppText>
        <AppText variant="label" color="muted">A leads</AppText>
      </View>
      <View style={summaryStyles.item}>
        <AppText variant="mono" style={[summaryStyles.count, { color: COLORS.text_secondary }]}>
          {ties}
        </AppText>
        <AppText variant="label" color="muted">Tied</AppText>
      </View>
      <View style={summaryStyles.item}>
        <AppText variant="mono" style={[summaryStyles.count, { color: COLORS.terra_primary }]}>
          {bWins}
        </AppText>
        <AppText variant="label" color="muted">B leads</AppText>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING['6'],
    paddingVertical: SPACING['3'],
    borderTopWidth: 1,
    borderTopColor: COLORS.border_subtle,
    marginTop: SPACING['2'],
  },
  item: {
    alignItems: 'center',
    gap: SPACING['1'],
  },
  count: {
    fontSize: 18,
    fontWeight: '700',
  },
});

// ─── Main Component ──────────────────────────

export function TraitComparison({ parentA, parentB }: TraitComparisonProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <AppText variant="label" color="muted" style={styles.headerLabel}>
          Parent A
        </AppText>
        <AppText variant="label" color="muted" style={styles.headerLabel}>
          Parent B
        </AppText>
      </View>

      {/* Rows */}
      {COMPARISON_TRAITS.map((trait) => (
        <TraitComparisonRow
          key={trait.key}
          trait={trait}
          valA={getTraitValue(parentA, trait.key)}
          valB={getTraitValue(parentB, trait.key)}
        />
      ))}

      {/* Summary */}
      <ComparisonSummary parentA={parentA} parentB={parentB} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING['1'],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING['6'],
    marginBottom: SPACING['3'],
    paddingRight: 68,
  },
  headerLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    width: 48,
    textAlign: 'right',
  },
});