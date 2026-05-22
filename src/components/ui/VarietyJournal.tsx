// ─────────────────────────────────────────────
// src/components/ui/VarietyJournal.tsx
// Collection journal showing all 20 varieties with
// discovered/undiscovered status.
// ─────────────────────────────────────────────

import React, { useMemo } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Card } from './Card';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';
import {
  VARIETY_REGISTRY,
  getVarietiesForSpecies,
  getSpecies,
} from '../../genetics';
import type { JournalEntry, VarietyId } from '../../types';

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

const SPECIES_ORDER = ['tomato', 'chili', 'basil', 'radish'];

const SPECIES_LABELS: Record<string, string> = {
  tomato: 'Tomatoes',
  chili: 'Peppers',
  basil: 'Basil',
  radish: 'Radishes',
};

// ─── Props ────────────────────────────────────

type VarietyJournalProps = {
  visible: boolean;
  onClose: () => void;
  journalEntries: Record<string, JournalEntry>;
  totalVarieties: number;
};

// ─── Variety Card ─────────────────────────────

function VarietyCard({
  varietyId,
  discovered,
  entry,
}: {
  varietyId: VarietyId;
  discovered: boolean;
  entry?: JournalEntry;
}) {
  const vari = VARIETY_REGISTRY[varietyId];
  if (!vari) return null;

  return (
    <View style={[cardStyles.base, discovered ? cardStyles.discovered : cardStyles.undiscovered]}>
      {/* Top accent */}
      <View
        style={[
          cardStyles.accent,
          {
            backgroundColor: discovered
              ? COLORS.green_primary
              : COLORS.border_subtle,
          },
        ]}
      />

      {/* Emoji */}
      <AppText style={cardStyles.emoji}>
        {discovered ? speciesEmoji(vari.speciesId) : '❓'}
      </AppText>

      {/* Name */}
      <AppText
        variant="caption"
        color={discovered ? 'primary' : 'muted'}
        numberOfLines={1}
        style={cardStyles.name}
      >
        {discovered ? vari.displayName : '???'}
      </AppText>

      {/* Stats */}
      {discovered && entry && (
        <View style={cardStyles.stats}>
          <AppText variant="label" style={cardStyles.statText}>
            {entry.discoveredCount}×
          </AppText>
          {entry.bestRarityScore >= 0.60 && (
            <Ionicons name="star" size={8} color={COLORS.rarity_legendary} />
          )}
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  base: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['1'],
    overflow: 'hidden',
    position: 'relative',
  },
  discovered: {
    backgroundColor: COLORS.bg_surface,
    borderColor: COLORS.border_normal,
  },
  undiscovered: {
    backgroundColor: COLORS.bg_deep,
    borderColor: COLORS.border_subtle,
    opacity: 0.5,
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  emoji: {
    fontSize: 20,
  },
  name: {
    fontSize: 9,
    textAlign: 'center',
    paddingHorizontal: SPACING['1'],
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 8,
    color: COLORS.text_accent,
  },
});

// ─── Main Component ──────────────────────────

export function VarietyJournal({
  visible,
  onClose,
  journalEntries,
  totalVarieties,
}: VarietyJournalProps) {
  const discoveredCount = Object.keys(journalEntries).length;
  const progressPct = totalVarieties > 0
    ? Math.round((discoveredCount / totalVarieties) * 100)
    : 0;

  // Group varieties by species
  const speciesGroups = useMemo(() => {
    return SPECIES_ORDER.map((speciesId) => {
      const species = getSpecies(speciesId);
      const varieties = species.varietyIds
        .map((vid) => ({
          varietyId: vid,
          discovered: !!journalEntries[vid],
          entry: journalEntries[vid],
        }))
        .sort((a, b) => (a.discovered === b.discovered ? 0 : a.discovered ? -1 : 1));
      return { speciesId, label: SPECIES_LABELS[speciesId] ?? speciesId, varieties };
    });
  }, [journalEntries]);

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
          <View>
            <AppText variant="heading" color="primary">Collection Journal</AppText>
            <AppText variant="caption" color="muted">
              {discoveredCount} / {totalVarieties} varieties discovered
            </AppText>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.text_secondary} />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct}%` },
              ]}
            />
          </View>
          <AppText variant="mono" color="accent" style={styles.progressText}>
            {progressPct}%
          </AppText>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {speciesGroups.map(({ speciesId, label, varieties }) => (
            <View key={speciesId} style={styles.speciesSection}>
              <AppText variant="label" color="muted" style={styles.speciesLabel}>
                {label}
              </AppText>
              <View style={styles.grid}>
                {varieties.map((v) => (
                  <VarietyCard
                    key={v.varietyId}
                    varietyId={v.varietyId}
                    discovered={v.discovered}
                    entry={v.entry}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg_primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING['5'],
    paddingTop: SPACING['5'],
    paddingBottom: SPACING['3'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_subtle,
  },
  closeBtn: {
    padding: SPACING['2'],
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
    paddingHorizontal: SPACING['5'],
    paddingVertical: SPACING['3'],
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bg_overlay,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.green_bright,
    borderRadius: RADIUS.full,
  },
  progressText: {
    fontSize: 12,
    width: 36,
    textAlign: 'right',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING['5'],
    gap: SPACING['5'],
    paddingBottom: SPACING['10'],
  },
  speciesSection: {
    gap: SPACING['3'],
  },
  speciesLabel: {
    marginBottom: SPACING['1'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING['2'],
    justifyContent: 'flex-start',
  },
});