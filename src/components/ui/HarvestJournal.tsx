// ─────────────────────────────────────────────
// src/components/ui/HarvestJournal.tsx
// Phase 7 — Collapsible harvest history journal.
//
// Shows past harvests with species, date, quantity,
// quality, and spores earned.
// Uses existing HarvestItem from store — no new data.
// ─────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Card } from './Card';
import { Badge } from './Badge';
import { useHarvests, useAppStore } from '../../store';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import type { HarvestItem } from '../../types';

// ─── Helpers ──────────────────────────────────

function speciesEmoji(speciesId: string): string {
  const family = speciesId.split('_')[0];
  const map: Record<string, string> = {
    tomato: '🍅', chili: '🌶️', basil: '🌿', radish: '🥕',
  };
  return map[family] ?? '🌱';
}

function speciesLabel(id: string): string {
  const map: Record<string, string> = {
    tomato_cherry: 'Cherry Tomato',
    tomato_beefsteak: 'Beefsteak',
    tomato_roma: 'Roma',
    tomato_heirloom: 'Heirloom',
    tomato_yellow_pear: 'Yellow Pear',
    chili_cayenne: 'Cayenne',
    chili_jalapeno: 'Jalapeño',
    chili_habanero: 'Habanero',
    chili_bell: 'Bell Pepper',
    chili_serrano: 'Serrano',
    basil_sweet: 'Sweet Basil',
    basil_thai: 'Thai Basil',
    basil_purple: 'Purple Basil',
    basil_lemon: 'Lemon Basil',
    basil_holy: 'Holy Basil',
    radish_cherry: 'Cherry Belle',
    radish_daikon: 'Daikon',
    radish_watermelon: 'Watermelon',
    radish_black: 'Black Radish',
    radish_french: 'French Breakfast',
  };
  return map[id] ?? id.replace(/_/g, ' ');
}

function formatAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Harvest Journal Row ──────────────────────

function JournalRow({ harvest }: { harvest: HarvestItem }) {
  const qualityColor =
    harvest.quality >= 0.80 ? COLORS.status_thriving :
    harvest.quality >= 0.50 ? COLORS.status_stressed :
    COLORS.status_dying;

  return (
    <View style={rowStyles.container}>
      {/* Species emoji + name */}
      <View style={rowStyles.left}>
        <View style={rowStyles.iconBox}>
          <AppText style={rowStyles.emoji}>{speciesEmoji(harvest.speciesId)}</AppText>
        </View>
        <View style={rowStyles.info}>
          <AppText variant="body" color="primary" numberOfLines={1}>
            {speciesLabel(harvest.speciesId)}
          </AppText>
          <AppText variant="caption" color="muted">
            {formatAgo(harvest.harvestedAt)}
          </AppText>
        </View>
      </View>

      {/* Stats */}
      <View style={rowStyles.stats}>
        <View style={rowStyles.statItem}>
          <AppText variant="label" color="muted" style={rowStyles.statLabel}>QTY</AppText>
          <AppText variant="mono" color="primary">{harvest.quantity}</AppText>
        </View>
        <View style={rowStyles.statDivider} />
        <View style={rowStyles.statItem}>
          <AppText variant="label" color="muted" style={rowStyles.statLabel}>QLTY</AppText>
          <AppText variant="mono" style={{ color: qualityColor }}>
            {Math.round(harvest.quality * 100)}%
          </AppText>
        </View>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING['2'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg_deep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 18 },
  info: { gap: 2, flex: 1 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
  },
  statItem: { alignItems: 'center', gap: 1 },
  statLabel: { fontSize: 7, letterSpacing: 1.5 },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border_subtle,
  },
});

// ─── Empty State ──────────────────────────────

function EmptyJournal() {
  return (
    <View style={emptyStyles.container}>
      <Ionicons name="journal-outline" size={28} color={COLORS.green_muted} />
      <AppText variant="caption" color="muted" style={emptyStyles.text}>
        No harvests recorded yet.{'\n'}Harvest your first mature plant to begin your journal.
      </AppText>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: SPACING['2'],
    paddingVertical: SPACING['5'],
  },
  text: {
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 18,
  },
});

// ─── Main Component ──────────────────────────

type HarvestJournalProps = {
  defaultExpanded?: boolean;
};

export function HarvestJournal({ defaultExpanded = false }: HarvestJournalProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Get harvests sorted newest-first
  const harvestList = useAppStore((s) =>
    Object.values(s.harvests).sort((a, b) => b.harvestedAt - a.harvestedAt),
  );

  // Compute totals
  const totalHarvests = harvestList.length;
  const totalItems = harvestList.reduce((sum, h) => sum + h.quantity, 0);
  const avgQuality = totalHarvests > 0
    ? harvestList.reduce((sum, h) => sum + h.quality, 0) / totalHarvests
    : 0;

  return (
    <Card variant="default" padded={false} style={journalStyles.card}>
      {/* Header — always visible */}
      <Pressable
        style={journalStyles.header}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={journalStyles.headerLeft}>
          <Ionicons
            name="journal-outline"
            size={18}
            color={COLORS.text_accent}
          />
          <AppText variant="label" color="accent">
            Journal
          </AppText>
          <View style={journalStyles.summaryBadge}>
            <AppText variant="label" color="muted">
              {totalHarvests} harvests
            </AppText>
          </View>
        </View>

        <View style={journalStyles.headerRight}>
          {totalHarvests > 0 && (
            <AppText variant="caption" color="muted" style={journalStyles.avgQuality}>
              Ø {Math.round(avgQuality * 100)}% · {totalItems} items
            </AppText>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={COLORS.text_muted}
          />
        </View>
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View style={journalStyles.content}>
          {totalHarvests === 0 ? (
            <EmptyJournal />
          ) : (
            <>
              {/* Summary strip */}
              <View style={journalStyles.summaryRow}>
                <View style={journalStyles.summaryItem}>
                  <AppText variant="stat" color="green">{totalHarvests}</AppText>
                  <AppText variant="label" color="muted">Harvests</AppText>
                </View>
                <View style={journalStyles.summaryDivider} />
                <View style={journalStyles.summaryItem}>
                  <AppText variant="stat" color="green">{totalItems}</AppText>
                  <AppText variant="label" color="muted">Items</AppText>
                </View>
                <View style={journalStyles.summaryDivider} />
                <View style={journalStyles.summaryItem}>
                  <AppText variant="stat" color="accent">{Math.round(avgQuality * 100)}%</AppText>
                  <AppText variant="label" color="muted">Avg Qlty</AppText>
                </View>
              </View>

              {/* Recent harvests list */}
              <View style={journalStyles.listContainer}>
                {harvestList.slice(0, 10).map((h) => (
                  <JournalRow key={h.id} harvest={h} />
                ))}
              </View>

              {totalHarvests > 10 && (
                <AppText variant="caption" color="muted" style={journalStyles.more}>
                  +{totalHarvests - 10} more harvests
                </AppText>
              )}
            </>
          )}
        </View>
      )}
    </Card>
  );
}

const journalStyles = StyleSheet.create({
  card: {
    borderColor: COLORS.journal_border,
    backgroundColor: COLORS.journal_bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING['3'],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
  },
  summaryBadge: {
    backgroundColor: COLORS.bg_deep,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING['2'],
    paddingVertical: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
  },
  avgQuality: {
    fontSize: 9,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: COLORS.journal_border,
    padding: SPACING['3'],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['4'],
    paddingBottom: SPACING['3'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
    marginBottom: SPACING['2'],
  },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border_subtle,
  },
  listContainer: {
    gap: 0,
  },
  more: {
    textAlign: 'center',
    paddingTop: SPACING['2'],
    opacity: 0.6,
  },
});