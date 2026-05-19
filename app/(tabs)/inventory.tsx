// ─────────────────────────────────────────────
// app/(tabs)/inventory.tsx
// Inventory screen — seeds with genetics detail modal
// Phase 5: Shop access added to inventory header
// ─────────────────────────────────────────────

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell, AppText, Card, Badge, StatBar } from '../../src/components/ui';
import { ShopModal, HarvestResultModal } from '../../src/components/ui';
import { useSeeds, useHarvests, useTotalSeedCount, useCurrency, useInventoryActions, useGardenActions } from '../../src/store';
import { useSeedGeneticsInfo, DISPLAY_TRAITS } from '../../src/store/useGenetics';
import { SHOP_ITEMS, type ShopItem } from '../../src/store/inventoryStore';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import type { SeedItem, HarvestItem } from '../../src/types';

// ─── Helpers ──────────────────────────────────

function speciesLabel(id: string): string {
  const map: Record<string, string> = {
    tomato: 'Tomato', chili: 'Chili', basil: 'Basil', radish: 'Radish',
  };
  return map[id] ?? id;
}

function rarityBorderColor(rarity: SeedItem['rarity']): string {
  const map: Record<SeedItem['rarity'], string> = {
    common:    COLORS.rarity_common,
    uncommon:  COLORS.rarity_uncommon,
    rare:      COLORS.rarity_rare,
    legendary: COLORS.rarity_legendary,
  };
  return map[rarity];
}

function formatAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function traitValue(seed: SeedItem, key: string): number {
  return (seed.phenotype as Record<string, number>)[key] ?? 0;
}

// ─── Tab Toggle ───────────────────────────────

type InventoryTab = 'seeds' | 'harvests';

function TabToggle({
  active, onChange, seedCount, harvestCount,
}: {
  active: InventoryTab;
  onChange: (t: InventoryTab) => void;
  seedCount: number;
  harvestCount: number;
}) {
  return (
    <View style={styles.toggle}>
      {(['seeds', 'harvests'] as InventoryTab[]).map((tab) => (
        <Pressable
          key={tab}
          style={[styles.toggleBtn, active === tab && styles.toggleBtnActive]}
          onPress={() => onChange(tab)}
        >
          <AppText variant="label" style={{
            color: active === tab ? COLORS.text_accent : COLORS.text_muted,
          }}>
            {tab === 'seeds' ? `Seeds · ${seedCount}` : `Harvests · ${harvestCount}`}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Seed Card ────────────────────────────────

function SeedCard({ seed, onPress }: { seed: SeedItem; onPress: () => void }) {
  const ph = seed.phenotype;
  return (
    <Pressable
      style={({ pressed }) => [styles.seedCard, pressed && styles.seedCardPressed]}
      onPress={onPress}
    >
      <View style={styles.seedLeft}>
        <View style={[styles.seedIcon, { borderColor: rarityBorderColor(seed.rarity) }]}>
          <AppText style={styles.seedEmoji}>🌱</AppText>
        </View>
        <View style={styles.seedInfo}>
          <AppText variant="subheading" color="primary" style={styles.seedName}>
            {speciesLabel(seed.speciesId)}
          </AppText>
          <AppText variant="caption" color="muted">
            Gen {seed.generation} · ×{seed.quantity}
          </AppText>
          <View style={styles.seedBadges}>
            <Badge variant={seed.rarity} size="sm" />
            {seed.generation > 0 && (
              <Badge variant="info" label="Hybrid" size="sm" />
            )}
          </View>
        </View>
      </View>
      {/* Key trait strip */}
      <View style={styles.seedStats}>
        {['growthRate', 'fruitSize', 'yieldMultiplier'].map((k) => {
          const raw = (ph as Record<string, number>)[k] ?? 0;
          const pct = k === 'yieldMultiplier' ? Math.round((raw / 2) * 100) : Math.round(raw * 100);
          const color = pct >= 70 ? COLORS.status_thriving : pct >= 40 ? COLORS.status_stressed : COLORS.status_dying;
          return (
            <View key={k} style={styles.statMini}>
              <AppText variant="label" color="muted">{k.slice(0, 3).toUpperCase()}</AppText>
              <AppText variant="mono" style={[styles.statMiniVal, { color }]}>{pct}</AppText>
            </View>
          );
        })}
      </View>
      <Ionicons name="chevron-forward" size={14} color={COLORS.text_muted} />
    </Pressable>
  );
}

// ─── Seed Detail Modal ────────────────────────

function SeedDetailModal({ seed, onClose }: { seed: SeedItem; onClose: () => void }) {
  const geneticsInfo = useSeedGeneticsInfo(seed);

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={detailStyles.root}>
        {/* Header */}
        <View style={detailStyles.header}>
          <View>
            <AppText variant="heading" color="primary">{speciesLabel(seed.speciesId)}</AppText>
            <AppText variant="caption" color="muted">
              Gen {seed.generation} · ×{seed.quantity} · {formatAgo(seed.obtainedAt)}
            </AppText>
          </View>
          <Pressable onPress={onClose} style={detailStyles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text_secondary} />
          </Pressable>
        </View>

        <ScrollView
          style={detailStyles.scroll}
          contentContainerStyle={detailStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Rarity + identity */}
          <View style={detailStyles.badgeRow}>
            <Badge variant={seed.rarity} />
            {seed.generation > 0 && <Badge variant="info" label={`Gen ${seed.generation} Hybrid`} />}
          </View>

          {/* Genetics breakdown */}
          {geneticsInfo && geneticsInfo.rarityBreakdown.rareGenes.length > 0 && (
            <Card variant="highlight" style={detailStyles.section}>
              <AppText variant="label" color="accent" style={detailStyles.sectionLabel}>
                Rare Traits · {geneticsInfo.rarityBreakdown.rareGenes.length} expressed
              </AppText>
              {geneticsInfo.rarityBreakdown.rareGenes.map((g) => (
                <View key={g.key} style={detailStyles.rareGeneRow}>
                  <View style={detailStyles.rareGeneDot} />
                  <AppText variant="caption" color="accent">{g.label}</AppText>
                  <AppText variant="mono" style={detailStyles.rareExpr}>{g.expression}</AppText>
                </View>
              ))}
            </Card>
          )}

          {/* All phenotype traits */}
          <Card variant="default" style={detailStyles.section}>
            <AppText variant="label" color="muted" style={detailStyles.sectionLabel}>
              Expressed Traits
            </AppText>
            {DISPLAY_TRAITS.map(({ key, label }) => {
              const raw = traitValue(seed, key);
              const isColor = key.includes('ColorShift');
              const value = isColor
                ? (raw + 1) / 2  // normalise -1..1 → 0..1 for bar display
                : key === 'yieldMultiplier'
                  ? raw / 2
                  : raw;
              const pct = Math.round(value * 100);
              const barColor =
                pct >= 70 ? COLORS.status_thriving :
                pct >= 40 ? COLORS.status_stressed :
                COLORS.status_dying;
              return (
                <StatBar
                  key={key}
                  label={label}
                  value={value}
                  color={barColor}
                  compact
                />
              );
            })}
          </Card>

          {/* Lineage */}
          {(seed.parentIds[0] || seed.parentIds[1]) && (
            <Card variant="inset" style={detailStyles.section}>
              <AppText variant="label" color="muted" style={detailStyles.sectionLabel}>
                Lineage
              </AppText>
              <AppText variant="caption" color="secondary">
                Bred from generation {seed.generation - 1} parents.
              </AppText>
              <AppText variant="mono" style={detailStyles.lineageId} numberOfLines={1}>
                A: {seed.parentIds[0] ?? '—'}
              </AppText>
              <AppText variant="mono" style={detailStyles.lineageId} numberOfLines={1}>
                B: {seed.parentIds[1] ?? '—'}
              </AppText>
            </Card>
          )}

          {/* Genotype string — compact representation */}
          <Card variant="inset" style={detailStyles.section}>
            <AppText variant="label" color="muted" style={detailStyles.sectionLabel}>
              Genotype
            </AppText>
            <AppText variant="mono" style={detailStyles.genotypeStr}>
              {geneticsInfo?.genotypeString ?? '—'}
            </AppText>
            <AppText variant="caption" color="muted" style={detailStyles.genotypeKey}>
              STR · FOL · VIG · WTR · LGT · FSZ · YLD · PGA · PGB · SED
            </AppText>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Harvest Card ─────────────────────────────

function HarvestCard({ harvest }: { harvest: HarvestItem }) {
  return (
    <View style={styles.harvestCard}>
      <View style={styles.harvestLeft}>
        <AppText style={styles.seedEmoji}>🍅</AppText>
        <View>
          <AppText variant="subheading" color="primary">{speciesLabel(harvest.speciesId)}</AppText>
          <AppText variant="caption" color="muted">
            Qty {harvest.quantity} · Quality {Math.round(harvest.quality * 100)}%
          </AppText>
        </View>
      </View>
      <AppText variant="label" color="muted">{formatAgo(harvest.harvestedAt)}</AppText>
    </View>
  );
}

// ─── Empty States ─────────────────────────────

function EmptySeedsState() {
  return (
    <Card variant="inset" style={styles.emptyCard}>
      <Ionicons name="leaf-outline" size={36} color={COLORS.green_muted} />
      <AppText variant="body" color="muted" style={styles.emptyText}>
        No seeds yet. Grow and harvest plants to collect seeds, or buy wild seeds from the Shop.
      </AppText>
    </Card>
  );
}

function EmptyHarvestsState() {
  return (
    <Card variant="inset" style={styles.emptyCard}>
      <Ionicons name="archive-outline" size={36} color={COLORS.terra_deep} />
      <AppText variant="body" color="muted" style={styles.emptyText}>
        No harvests yet. Grow plants to full maturity and harvest them.
      </AppText>
    </Card>
  );
}

// ─── Screen ───────────────────────────────────

export default function InventoryScreen() {
  const [activeTab, setActiveTab]     = useState<InventoryTab>('seeds');
  const [selectedSeed, setSelectedSeed] = useState<SeedItem | null>(null);
  const [showShop, setShowShop]         = useState(false);

  const seeds     = useSeeds();
  const harvests  = useHarvests();
  const totalSeeds = useTotalSeedCount();
  const currency   = useCurrency();

  const { spendCurrency, buyWildSeed, canAfford } = useInventoryActions();
  const { waterAllPlants, feedAllPlants }         = useGardenActions();

  const handleBuyItem = useCallback((item: ShopItem) => {
    if (!spendCurrency(item.cost)) return;
    if (item.id === 'water_pack') {
      waterAllPlants(0.35);
    } else if (item.id === 'nutrient_pack') {
      feedAllPlants(0.30);
    }
  }, [spendCurrency, waterAllPlants, feedAllPlants]);

  const handleBuyWildSeed = useCallback((speciesId: string) => {
    buyWildSeed(speciesId);
  }, [buyWildSeed]);

  const seedList = useMemo(() =>
    Object.values(seeds).sort((a, b) => b.phenotype.rarityScore - a.phenotype.rarityScore),
    [seeds],
  );

  const harvestList = useMemo(() =>
    Object.values(harvests).sort((a, b) => b.harvestedAt - a.harvestedAt),
    [harvests],
  );

  return (
    <ScreenShell title="Seeds" subtitle="Your genetic library">
      {/* Header row with Shop button */}
      <View style={styles.headerRow}>
        <TabToggle
          active={activeTab}
          onChange={setActiveTab}
          seedCount={totalSeeds}
          harvestCount={harvestList.length}
        />
        <Pressable
          style={styles.shopButton}
          onPress={() => setShowShop(true)}
        >
          <Ionicons name="storefront-outline" size={14} color={COLORS.rarity_legendary} />
          <AppText variant="label" style={{ color: COLORS.rarity_legendary, fontSize: 9 }}>
            {currency}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.listContainer}>
        {activeTab === 'seeds' ? (
          seedList.length === 0 ? (
            <EmptySeedsState />
          ) : (
            <FlatList
              data={seedList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SeedCard seed={item} onPress={() => setSelectedSeed(item)} />
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING['2'] }} />}
            />
          )
        ) : (
          harvestList.length === 0 ? (
            <EmptyHarvestsState />
          ) : (
            <FlatList
              data={harvestList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <HarvestCard harvest={item} />}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING['2'] }} />}
            />
          )
        )}
      </View>

      {selectedSeed && (
        <SeedDetailModal
          seed={selectedSeed}
          onClose={() => setSelectedSeed(null)}
        />
      )}

      <ShopModal
        visible={showShop}
        currency={currency}
        canAfford={canAfford}
        onBuyItem={handleBuyItem}
        onBuyWildSeed={handleBuyWildSeed}
        onClose={() => setShowShop(false)}
      />
    </ScreenShell>
  );
}

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
    marginBottom: SPACING['4'],
  },
  toggle: {
    flexDirection: 'row',
    flex: 1,
    backgroundColor: COLORS.bg_surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    padding: SPACING['1'],
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING['2'],
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.bg_overlay,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['1'],
    paddingHorizontal: SPACING['2'],
    paddingVertical: SPACING['2'],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    backgroundColor: COLORS.bg_surface,
  },
  listContainer: {
    gap: SPACING['2'],
  },
  seedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg_surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    padding: SPACING['3'],
    gap: SPACING['2'],
  },
  seedCardPressed: {
    backgroundColor: COLORS.bg_raised,
  },
  seedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
    flex: 1,
  },
  seedIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: COLORS.bg_deep,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  seedEmoji: { fontSize: 22 },
  seedInfo:  { gap: SPACING['1'], flex: 1 },
  seedName:  { fontSize: TYPOGRAPHY.size.md },
  seedBadges: {
    flexDirection: 'row',
    gap: SPACING['1'],
    marginTop: SPACING['1'],
  },
  seedStats: {
    flexDirection: 'row',
    gap: SPACING['3'],
    alignItems: 'center',
  },
  statMini: {
    alignItems: 'center',
    gap: 1,
  },
  statMiniVal: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  harvestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bg_surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    padding: SPACING['3'],
  },
  harvestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
  },
  emptyCard: {
    alignItems: 'center',
    gap: SPACING['4'],
    paddingVertical: SPACING['8'],
    marginTop: SPACING['4'],
  },
  emptyText: {
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
  },
});

const detailStyles = StyleSheet.create({
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
    gap: SPACING['3'],
  },
  closeBtn: {
    padding: SPACING['2'],
    marginTop: -SPACING['1'],
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING['5'],
    gap: SPACING['4'],
    paddingBottom: SPACING['10'],
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING['2'],
    flexWrap: 'wrap',
  },
  section: {},
  sectionLabel: {
    marginBottom: SPACING['3'],
  },
  rareGeneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['2'],
    marginBottom: SPACING['1'],
  },
  rareGeneDot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.text_accent,
  },
  rareExpr: {
    marginLeft: 'auto',
    fontSize: 10,
    color: COLORS.text_muted,
  },
  lineageId: {
    fontSize: 9,
    color: COLORS.text_muted,
    marginTop: SPACING['1'],
  },
  genotypeStr: {
    fontSize: 11,
    color: COLORS.text_secondary,
    letterSpacing: 2,
    lineHeight: 18,
  },
  genotypeKey: {
    marginTop: SPACING['2'],
    fontSize: 9,
    letterSpacing: 1.2,
    lineHeight: 16,
  },
});