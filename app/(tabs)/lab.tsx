// ─────────────────────────────────────────────
// app/(tabs)/lab.tsx
//
// Genetics Lab — the breeding workbench.
//
// Flow:
//   1. Player selects Parent A seed from inventory
//   2. Player selects Parent B seed (same species)
//   3. Preview panel shows expected offspring trait ranges
//   4. Player presses Breed → offspring seeds added to inventory
//   5. Result modal shows what was produced
//
// Phase 2: full genetics wiring.
// Phase 5: seed consumption on breed.
// ─────────────────────────────────────────────

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell, AppText, Card, Badge, SeedCompareModal } from '../../src/components/ui';
import { asIconName } from '../../src/utils/formatters';
import {
  useSeeds,
  useAppStore,
} from '../../src/store';
import {
  COLORS,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
} from '../../src/constants/theme';
import type { SeedItem } from '../../src/types';
import {
  previewBreed,
  type PhenotypePreview,
} from '../../src/genetics';
import { useGameActions, BREED_COST, type BreedResult } from '../../src/game';

// ─── Helpers ──────────────────────────────────

function speciesLabel(id: string): string {
  const map: Record<string, string> = {
    tomato: 'Tomato', chili: 'Chili', basil: 'Basil', radish: 'Radish',
  };
  return map[id] ?? id;
}

function rarityColor(rarity: SeedItem['rarity']): string {
  const map: Record<SeedItem['rarity'], string> = {
    common:    COLORS.rarity_common,
    uncommon:  COLORS.rarity_uncommon,
    rare:      COLORS.rarity_rare,
    legendary: COLORS.rarity_legendary,
  };
  return map[rarity];
}

function formatTrait(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

// Key traits to surface in the preview (the others are less visually significant)
const PREVIEW_TRAITS = [
  'heightFactor', 'growthRate', 'fruitSize',
  'fruitCount', 'yieldMultiplier', 'waterEfficiency',
  'primaryColorShift', 'rarityScore',
];

// ─── Seed Picker Modal ────────────────────────

type SeedPickerProps = {
  visible: boolean;
  title: string;
  excludeId?: string | null;
  filterSpecies?: string | null;
  onSelect: (seed: SeedItem) => void;
  onClose: () => void;
};

function SeedPickerModal({
  visible, title, excludeId, filterSpecies, onSelect, onClose,
}: SeedPickerProps) {
  const seeds = useSeeds();

  const list = useMemo(() => {
    return Object.values(seeds)
      .filter((s) => {
        if (s.id === excludeId) return false;
        if (filterSpecies && s.speciesId !== filterSpecies) return false;
        return s.quantity > 0;
      })
      .sort((a, b) => b.phenotype.rarityScore - a.phenotype.rarityScore);
  }, [seeds, excludeId, filterSpecies]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={pickerStyles.root}>
        {/* Header */}
        <View style={pickerStyles.header}>
          <AppText variant="heading" color="primary">{title}</AppText>
          <Pressable onPress={onClose} style={pickerStyles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text_secondary} />
          </Pressable>
        </View>
        {filterSpecies && (
          <AppText variant="caption" color="muted" style={pickerStyles.filterNote}>
            Showing {speciesLabel(filterSpecies)} seeds only
          </AppText>
        )}

        {list.length === 0 ? (
          <View style={pickerStyles.emptyState}>
            <Ionicons name="leaf-outline" size={40} color={COLORS.green_muted} />
            <AppText variant="body" color="muted" style={pickerStyles.emptyText}>
              {filterSpecies
                ? `No other ${speciesLabel(filterSpecies)} seeds in inventory.`
                : 'No seeds in inventory.'}
            </AppText>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(item) => item.id}
            contentContainerStyle={pickerStyles.list}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  pickerStyles.seedRow,
                  pressed && pickerStyles.seedRowPressed,
                ]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                {/* Rarity stripe */}
                <View
                  style={[
                    pickerStyles.rarityStripe,
                    { backgroundColor: rarityColor(item.rarity) },
                  ]}
                />
                <View style={pickerStyles.seedInfo}>
                  <View style={pickerStyles.seedTopRow}>
                    <AppText variant="subheading" color="primary">
                      {speciesLabel(item.speciesId)}
                    </AppText>
                    <Badge variant={item.rarity} size="sm" />
                  </View>
                  <AppText variant="caption" color="muted">
                    Gen {item.generation} · ×{item.quantity} available
                  </AppText>
                  <View style={pickerStyles.traitRow}>
                    {['growthRate', 'fruitSize', 'yieldMultiplier'].map((t) => {
                      const raw = item.phenotype[t as keyof typeof item.phenotype] as number;
                      const pct = t === 'yieldMultiplier'
                        ? Math.round((raw / 2) * 100)
                        : Math.round(raw * 100);
                      return (
                        <View key={t} style={pickerStyles.miniStat}>
                          <AppText variant="label" color="muted">{formatTrait(t).slice(0, 3).toUpperCase()}</AppText>
                          <AppText variant="mono" style={{ color: pct > 60 ? COLORS.status_thriving : COLORS.text_secondary, fontSize: 11 }}>
                            {pct}
                          </AppText>
                        </View>
                      );
                    })}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.text_muted} />
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Parent Slot ──────────────────────────────

type ParentSlotProps = {
  label: string;
  seed: SeedItem | null;
  onPress: () => void;
  onClear?: () => void;
};

function ParentSlot({ label, seed, onPress, onClear }: ParentSlotProps) {
  return (
    <View style={slotStyles.wrapper}>
      <AppText variant="label" color="muted" style={slotStyles.label}>{label}</AppText>
      <Pressable
        style={({ pressed }) => [
          slotStyles.slot,
          seed ? slotStyles.slotFilled : slotStyles.slotEmpty,
          pressed && slotStyles.slotPressed,
        ]}
        onPress={onPress}
      >
        {seed ? (
          <View style={slotStyles.filledContent}>
            <View style={[slotStyles.rarityDot, { backgroundColor: rarityColor(seed.rarity) }]} />
            <AppText style={slotStyles.emoji}>🌱</AppText>
            <AppText variant="caption" color="primary" numberOfLines={1}>{speciesLabel(seed.speciesId)}</AppText>
            <Badge variant={seed.rarity} size="sm" />
            <AppText variant="label" color="muted">Gen {seed.generation}</AppText>
          </View>
        ) : (
          <View style={slotStyles.emptyContent}>
            <Ionicons name="add-circle-outline" size={28} color={COLORS.green_muted} />
            <AppText variant="caption" color="muted">Select seed</AppText>
          </View>
        )}
      </Pressable>
      {seed && onClear && (
        <Pressable style={slotStyles.clearBtn} onPress={onClear}>
          <Ionicons name="close-circle" size={18} color={COLORS.text_muted} />
        </Pressable>
      )}
    </View>
  );
}

// ─── Trait Preview Bar ────────────────────────

type TraitPreviewBarProps = { preview: PhenotypePreview };

function TraitPreviewBar({ preview }: TraitPreviewBarProps) {
  const isColorShift = preview.trait.includes('ColorShift');
  const range = isColorShift ? [-1, 1] : preview.trait === 'yieldMultiplier' ? [0, 2] : [0, 1];
  const span = range[1] - range[0];

  // Normalise to 0–1 for bar width
  const normalise = (v: number) => (v - range[0]) / span;
  const minN  = normalise(preview.min);
  const meanN = normalise(preview.mean);
  const maxN  = normalise(preview.max);

  const barColor = meanN > 0.65 ? COLORS.status_thriving
    : meanN > 0.40 ? COLORS.status_stressed
    : COLORS.status_dying;

  return (
    <View style={previewStyles.row}>
      <AppText variant="label" color="muted" style={previewStyles.traitLabel}>
        {formatTrait(preview.trait).toUpperCase().slice(0, 6)}
      </AppText>
      {/* Track */}
      <View style={previewStyles.track}>
        {/* Range band (min→max) */}
        <View
          style={[
            previewStyles.rangeBand,
            {
              left: `${minN * 100}%`,
              width: `${(maxN - minN) * 100}%`,
            },
          ]}
        />
        {/* Mean marker */}
        <View style={[previewStyles.meanMarker, { left: `${meanN * 100}%` }]} />
      </View>
      <AppText variant="mono" style={[previewStyles.meanVal, { color: barColor }]}>
        {isColorShift
          ? (preview.mean >= 0 ? `+${preview.mean.toFixed(1)}` : preview.mean.toFixed(1))
          : preview.trait === 'yieldMultiplier'
            ? `${preview.mean.toFixed(1)}×`
            : `${Math.round(preview.mean * 100)}%`}
      </AppText>
    </View>
  );
}

// ─── Breed Result Modal ───────────────────────

type BreedResultProps = {
  visible: boolean;
  seeds: SeedItem[];
  mutationEvents: number;
  onClose: () => void;
};

function BreedResultModal({ visible, seeds, mutationEvents, onClose }: BreedResultProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={resultStyles.overlay}>
        <View style={resultStyles.sheet}>
          {/* Header */}
          <View style={resultStyles.header}>
            <AppText variant="heading" color="accent">Breeding Complete</AppText>
            {mutationEvents > 0 && (
              <AppText variant="caption" color="terra">
                ⚡ {mutationEvents} mutation{mutationEvents > 1 ? 's' : ''} occurred
              </AppText>
            )}
          </View>

          <AppText variant="label" color="muted" style={resultStyles.subLabel}>
            New seeds added to inventory
          </AppText>

          {/* Offspring list */}
          {seeds.map((seed, i) => (
            <View key={seed.id} style={resultStyles.offspringRow}>
              <View style={[resultStyles.offspringIndex, { borderColor: rarityColor(seed.rarity) }]}>
                <AppText variant="mono" color="muted">{i + 1}</AppText>
              </View>
              <View style={resultStyles.offspringInfo}>
                <View style={resultStyles.offspringTopRow}>
                  <AppText variant="body" color="primary">{speciesLabel(seed.speciesId)}</AppText>
                  <Badge variant={seed.rarity} />
                </View>
                <AppText variant="caption" color="muted">
                  Gen {seed.generation} · Rarity {Math.round(seed.phenotype.rarityScore * 100)}%
                </AppText>
              </View>
            </View>
          ))}

          <Pressable style={resultStyles.doneBtn} onPress={onClose}>
            <AppText variant="label" color="accent">Done</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────

export default function LabScreen() {
  const { breedFromInventory } = useGameActions();

  const [parentA, setParentA] = useState<SeedItem | null>(null);
  const [parentB, setParentB] = useState<SeedItem | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'A' | 'B' | null>(null);
  const [isBreeding, setIsBreeding] = useState(false);
  const [resultSeeds, setResultSeeds] = useState<SeedItem[]>([]);
  const [resultMutations, setResultMutations] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // ── Preview (memoised — only recomputes when parents change) ──
  const preview = useMemo<PhenotypePreview[]>(() => {
    if (!parentA || !parentB) return [];
    return previewBreed(parentA, parentB, 20)
      .filter((p) => PREVIEW_TRAITS.includes(p.trait));
  }, [parentA, parentB]);

  // Compare modal state
  const [showCompare, setShowCompare] = useState(false);

  // ── Breed ─────────────────────────────────
  const handleBreed = useCallback(() => {
    if (!parentA || !parentB) return;
    setIsBreeding(true);

    setTimeout(() => {
      const result = breedFromInventory(parentA.id, parentB.id);

      if (!result.ok) {
        // Show error — currently just clear breeding state
        console.warn('[Lab] Breed failed:', result.reason);
        setIsBreeding(false);
        return;
      }

      const addedSeeds = useAppStore.getState().seeds;
      const offspring = result.seedIds.map((id) => addedSeeds[id]).filter(Boolean) as SeedItem[];

      setResultSeeds(offspring);
      setResultMutations(result.mutationEvents);
      setShowResult(true);
      setIsBreeding(false);
    }, 300);
  }, [parentA, parentB, breedFromInventory]);

  // ── Species compatibility check ────────────
  const canBreed = !!parentA && !!parentB;
  const bothSelected = !!parentA && !!parentB;

  return (
    <ScreenShell title="Lab" subtitle="Genetics workbench">

      {/* ── Breeding Station ── */}
      <Card variant="raised" style={styles.section}>
        <AppText variant="label" color="muted" style={styles.sectionHeader}>
          Breeding Station
        </AppText>

        <View style={styles.parentsRow}>
          <ParentSlot
            label="Parent A"
            seed={parentA}
            onPress={() => setPickerTarget('A')}
            onClear={() => setParentA(null)}
          />
          <View style={styles.crossDivider}>
            <AppText style={styles.crossGlyph}>×</AppText>
          </View>
          <ParentSlot
            label="Parent B"
            seed={parentB}
            onPress={() => setPickerTarget('B')}
            onClear={() => setParentB(null)}
          />
        </View>

          {/* Compare button (visible when both parents selected) */}
        {bothSelected && (
          <Pressable
            style={({ pressed }) => [
              styles.compareBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setShowCompare(true)}
          >
            <Ionicons name="analytics-outline" size={14} color={COLORS.text_secondary} />
            <AppText variant="caption" color="secondary">
              Compare Parents
            </AppText>
          </Pressable>
        )}

        {/* Cross-species breeding indicator */}
        {parentA && parentB && parentA.speciesId !== parentB.speciesId && (
          <View style={styles.warningRow}>
            <Ionicons name="flask-outline" size={14} color={COLORS.rarity_legendary} />
            <AppText variant="caption" style={{ color: COLORS.rarity_legendary }}>
              Cross-species hybrid! Offspring species determined by VIGOR dominance.
            </AppText>
          </View>
        )}

        {/* Breed button */}
        <Pressable
          style={({ pressed }) => [
            styles.breedBtn,
            canBreed && styles.breedBtnActive,
            pressed && canBreed && styles.breedBtnPressed,
          ]}
          onPress={handleBreed}
          disabled={!canBreed || isBreeding}
        >
          <Ionicons
            name="git-merge-outline"
            size={18}
            color={canBreed ? COLORS.text_accent : COLORS.text_muted}
          />
          <AppText
            variant="label"
            style={{ color: canBreed ? COLORS.text_accent : COLORS.text_muted }}
          >
            {isBreeding ? 'Breeding…' : canBreed ? `Breed · 3 offspring · ${BREED_COST} ✦` : 'Select both parents'}
          </AppText>
        </Pressable>
      </Card>

      {/* ── Trait Preview ── */}
      {preview.length > 0 && (
        <Card variant="inset" style={styles.section}>
          <AppText variant="label" color="muted" style={styles.sectionHeader}>
            Offspring Trait Preview
          </AppText>
          <AppText variant="caption" color="muted" style={styles.previewNote}>
            Based on 20 simulated crosses · bar = expected range · marker = mean
          </AppText>
          {preview.map((p) => (
            <TraitPreviewBar key={p.trait} preview={p} />
          ))}
        </Card>
      )}

      {/* ── How It Works (shown when no parents selected) ── */}
      {!parentA && !parentB && <HowItWorksSection />}
      {parentA && parentB && parentA.speciesId !== parentB.speciesId && <CrossSpeciesGuide />}

      {/* ── Seed Picker Modal ── */}
      <SeedPickerModal
        visible={pickerTarget === 'A'}
        title="Select Parent A"
        excludeId={parentB?.id}
        onSelect={setParentA}
        onClose={() => setPickerTarget(null)}
      />
      <SeedPickerModal
        visible={pickerTarget === 'B'}
        title="Select Parent B"
        excludeId={parentA?.id}
        filterSpecies={null} // Allow any species — cross-breeding enabled!
        onSelect={setParentB}
        onClose={() => setPickerTarget(null)}
      />

      {/* ── Seed Compare Modal ── */}
      {parentA && parentB && (
        <SeedCompareModal
          visible={showCompare}
          seedA={parentA}
          seedB={parentB}
          onClose={() => setShowCompare(false)}
        />
      )}

      {/* ── Breed Result Modal ── */}
      <BreedResultModal
        visible={showResult}
        seeds={resultSeeds}
        mutationEvents={resultMutations}
        onClose={() => {
          setShowResult(false);
          setParentA(null);
          setParentB(null);
        }}
      />
    </ScreenShell>
  );
}

// ─── How It Works ─────────────────────────────

function CrossSpeciesGuide() {
  const steps = [
    { icon: 'flask-outline',     text: 'You selected seeds from different species — hybridisation in progress!' },
    { icon: 'trending-up-outline', text: 'Offspring species is determined by which parent has more dominant VIGOR alleles' },
    { icon: 'color-palette-outline', text: 'Base traits are blended between both parent species' },
    { icon: 'star-outline',      text: 'Cross-species hybrids earn a +10% rarity boost — they are unusual finds!' },
    { icon: 'archive-outline',   text: 'All 3 offspring seeds are added to your inventory as usual' },
  ];

  return (
    <View style={howStyles.section}>
      <AppText variant="label" color="muted" style={howStyles.header}>
        Cross-Species Breeding Guide
      </AppText>
      {steps.map((step, i) => (
        <View key={i} style={howStyles.row}>
          <View style={howStyles.iconBox}>
            <Ionicons name={asIconName(step.icon)} size={15} color={COLORS.rarity_legendary} />
          </View>
          <AppText variant="caption" color="secondary" style={howStyles.text}>
            {step.text}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function HowItWorksSection() {
  const steps = [
    { icon: 'leaf-outline',      text: 'Select two seeds (any species — cross-breeding allowed!)' },
    { icon: 'git-merge-outline', text: 'Each gene is inherited from one parent via Mendelian segregation' },
    { icon: 'flash-outline',     text: 'Rare mutations may flip individual alleles' },
    { icon: 'star-outline',      text: 'Offspring with unusual allele combinations score higher rarity' },
    { icon: 'archive-outline',   text: '3 new seeds are produced and added to your inventory' },
  ];

  return (
    <View style={howStyles.section}>
      <AppText variant="label" color="muted" style={howStyles.header}>
        Genetics Guide
      </AppText>
      {steps.map((step, i) => (
        <View key={i} style={howStyles.row}>
          <View style={howStyles.iconBox}>
            <Ionicons name={asIconName(step.icon)} size={15} color={COLORS.green_primary} />
          </View>
          <AppText variant="caption" color="secondary" style={howStyles.text}>
            {step.text}
          </AppText>
        </View>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING['4'],
  },
  sectionHeader: {
    marginBottom: SPACING['3'],
  },
  parentsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING['2'],
    marginBottom: SPACING['3'],
  },
  crossDivider: {
    marginTop: SPACING['8'],
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  crossGlyph: {
    fontSize: 18,
    color: COLORS.text_muted,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
    marginBottom: SPACING['3'],
  },
  breedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['2'],
    paddingVertical: SPACING['3'],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    backgroundColor: COLORS.bg_deep,
    opacity: 0.55,
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['2'],
    paddingVertical: SPACING['2'],
    marginBottom: SPACING['2'],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    backgroundColor: COLORS.bg_deep,
  },
  breedBtnActive: {
    opacity: 1,
    borderColor: COLORS.green_deep,
    backgroundColor: COLORS.bg_overlay,
  },
  breedBtnPressed: {
    backgroundColor: COLORS.bg_raised,
  },
  previewNote: {
    marginBottom: SPACING['3'],
    lineHeight: 18,
  },
});

const slotStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  label: {
    textAlign: 'center',
    marginBottom: SPACING['2'],
  },
  slot: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3'],
  },
  slotEmpty: {
    backgroundColor: COLORS.bg_deep,
    borderColor: COLORS.border_subtle,
    borderStyle: 'dashed',
  },
  slotFilled: {
    backgroundColor: COLORS.bg_surface,
    borderColor: COLORS.green_deep,
  },
  slotPressed: {
    opacity: 0.7,
  },
  emptyContent: {
    alignItems: 'center',
    gap: SPACING['2'],
  },
  filledContent: {
    alignItems: 'center',
    gap: SPACING['1'],
  },
  emoji: {
    fontSize: 26,
  },
  rarityDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
  },
  clearBtn: {
    position: 'absolute',
    top: 24,
    right: -8,
    zIndex: 10,
  },
});

const previewStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
    marginBottom: SPACING['2'],
  },
  traitLabel: {
    width: 44,
    flexShrink: 0,
    fontSize: 9,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.bg_overlay,
    borderRadius: RADIUS.full,
    overflow: 'visible',
    position: 'relative',
  },
  rangeBand: {
    position: 'absolute',
    height: '100%',
    backgroundColor: COLORS.green_deep,
    borderRadius: RADIUS.full,
    opacity: 0.7,
  },
  meanMarker: {
    position: 'absolute',
    width: 3,
    height: 10,
    top: -2,
    backgroundColor: COLORS.green_bright,
    borderRadius: RADIUS.full,
    marginLeft: -1.5,
  },
  meanVal: {
    width: 40,
    textAlign: 'right',
    fontSize: TYPOGRAPHY.size.xs,
    flexShrink: 0,
  },
});

const pickerStyles = StyleSheet.create({
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
  filterNote: {
    paddingHorizontal: SPACING['5'],
    paddingTop: SPACING['2'],
  },
  list: {
    padding: SPACING['5'],
    gap: SPACING['2'],
  },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    overflow: 'hidden',
    paddingRight: SPACING['3'],
  },
  seedRowPressed: {
    backgroundColor: COLORS.bg_raised,
  },
  rarityStripe: {
    width: 4,
    alignSelf: 'stretch',
    opacity: 0.8,
  },
  seedInfo: {
    flex: 1,
    padding: SPACING['3'],
    gap: SPACING['1'],
  },
  seedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  traitRow: {
    flexDirection: 'row',
    gap: SPACING['4'],
    marginTop: SPACING['1'],
  },
  miniStat: {
    alignItems: 'center',
    gap: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['4'],
    padding: SPACING['8'],
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 22,
  },
});

const resultStyles = StyleSheet.create({
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
    gap: SPACING['3'],
  },
  header: {
    gap: SPACING['1'],
  },
  subLabel: {
    marginBottom: SPACING['2'],
  },
  offspringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
    backgroundColor: COLORS.bg_raised,
    borderRadius: RADIUS.md,
    padding: SPACING['3'],
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  offspringIndex: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg_deep,
    flexShrink: 0,
  },
  offspringInfo: {
    flex: 1,
    gap: SPACING['1'],
  },
  offspringTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: SPACING['3'],
    marginTop: SPACING['2'],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.green_deep,
    backgroundColor: COLORS.bg_overlay,
  },
});

const howStyles = StyleSheet.create({
  section: {
    gap: SPACING['3'],
  },
  header: {
    marginBottom: SPACING['2'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING['3'],
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg_surface,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    flex: 1,
    lineHeight: 20,
    paddingTop: SPACING['1'],
  },
});
