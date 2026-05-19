// ─────────────────────────────────────────────
// app/(tabs)/garden.tsx
// Garden screen — SVG plant rendering in plot grid
// Phase 5: Full game loop — harvest → seeds → replant
// ─────────────────────────────────────────────

import React, { useCallback, useState } from 'react';
import {
  View, Pressable, StyleSheet,
  Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell, AppText, Card, Badge, StatBar, GrowthTimer } from '../../src/components/ui';
import { ShopModal, HarvestResultModal } from '../../src/components/ui';
import { PlantRenderer } from '../../src/components/plants';
import {
  useGardenPlots, useGardenPlants,
  useOccupiedPlotCount, useGardenActions,
  useSeeds, useInventoryActions,
  usePlantsNeedingWater, useSimulationSpeed,
  useCurrency, useAppStore,
} from '../../src/store';
import { SHOP_ITEMS, type HarvestResult, type ShopItem } from '../../src/store/inventoryStore';
import { showSuccess, showInfo } from '../../src/components/feedback/useToastStore';
import {
  COLORS, SPACING, RADIUS, GAME, TYPOGRAPHY,
} from '../../src/constants/theme';
import type { GardenPlot, PlantInstance, SeedItem } from '../../src/types';

// ─── Constants ────────────────────────────────

const CELL_SIZE    = 88;
const PLANT_SIZE   = 72; // SVG canvas inside cell

// ─── Empty / Locked Plot Cell ─────────────────

function EmptyPlotCell({ plot, onPress }: {
  plot: GardenPlot;
  onPress: (id: string) => void;
}) {
  if (plot.state === 'locked') {
    return (
      <View style={[styles.cell, styles.cellLocked]}>
        <Ionicons name="lock-closed" size={18} color={COLORS.text_muted} />
        <AppText variant="label" color="muted" style={styles.cellLabel}>locked</AppText>
      </View>
    );
  }
  return (
    <Pressable
      style={({ pressed }) => [styles.cell, styles.cellEmpty, pressed && styles.cellPressed]}
      onPress={() => onPress(plot.id)}
    >
      <Ionicons name="add-circle-outline" size={22} color={COLORS.green_muted} />
      <AppText variant="label" color="muted" style={styles.cellLabel}>plant</AppText>
    </Pressable>
  );
}

// ─── Occupied Plot Cell ───────────────────────

function OccupiedPlotCell({ plot, plant, onPress }: {
  plot: GardenPlot;
  plant: PlantInstance;
  onPress: (plant: PlantInstance) => void;
}) {
  const isHarvestReady = plant.growthStage === 'harvest_ready';
  const needsWater     = plant.waterLevel < 0.30;
  const needsNutrients = plant.nutrientLevel < 0.25;
  const isDead         = plant.growthStage === 'dead';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cell,
        styles.cellOccupied,
        isHarvestReady && styles.cellHarvestReady,
        isDead && styles.cellDead,
        pressed && styles.cellPressed,
      ]}
      onPress={() => onPress(plant)}
    >
      {/* Health dot — top-right corner */}
      <View style={[styles.healthDot, { backgroundColor: healthColor(plant.health) }]} />

      {/* SVG Plant */}
      <PlantRenderer
        plant={plant}
        width={PLANT_SIZE}
        height={PLANT_SIZE}
      />

      {/* Bottom row: stage label + alert icons */}
      <View style={styles.alertRow}>
        {needsWater && (
          <Ionicons name="water" size={9} color={COLORS.rarity_rare} />
        )}
        {needsNutrients && (
          <Ionicons name="leaf" size={9} color={COLORS.status_stressed} />
        )}
        {isHarvestReady && (
          <Ionicons name="star" size={9} color={COLORS.rarity_legendary} />
        )}
        {isDead && (
          <AppText style={[styles.stageMicro, { color: COLORS.status_dying }]}>DEAD</AppText>
        )}
        {!needsWater && !needsNutrients && !isHarvestReady && !isDead && (
          <AppText style={styles.stageMicro}>
            {plant.growthStage === 'vegetative' ? 'GROW' :
             plant.growthStage === 'flowering'  ? 'FLWR' :
             plant.growthStage === 'mature'     ? 'MATR' :
             plant.growthStage === 'decaying'   ? 'DCAY' :
             plant.growthStage.slice(0,4).toUpperCase()}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

function healthColor(h: PlantInstance['health']): string {
  const map: Record<PlantInstance['health'], string> = {
    thriving: COLORS.status_thriving, healthy:  COLORS.status_healthy,
    stressed: COLORS.status_stressed, wilting:  COLORS.status_wilting,
    dying:    COLORS.status_dying,
  };
  return map[h];
}

// ─── Plot Grid ────────────────────────────────

function PlotGrid({ onEmpty, onOccupied }: {
  onEmpty:    (plotId: string) => void;
  onOccupied: (plant: PlantInstance) => void;
}) {
  const plots  = useGardenPlots();
  const plants = useGardenPlants();

  const rows: GardenPlot[][] = [];
  for (let r = 0; r < GAME.GARDEN_ROWS; r++) {
    const row: GardenPlot[] = [];
    for (let c = 0; c < GAME.GARDEN_COLS; c++) {
      const plot = plots[`plot_${r}_${c}`];
      if (plot) row.push(plot);
    }
    if (row.length) rows.push(row);
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.gridRow}>
          {row.map((plot) => {
            if (plot.state === 'occupied' && plot.plantId) {
              const plant = plants[plot.plantId];
              if (plant) return (
                <OccupiedPlotCell key={plot.id} plot={plot} plant={plant} onPress={onOccupied} />
              );
            }
            return <EmptyPlotCell key={plot.id} plot={plot} onPress={onEmpty} />;
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Garden summary strip ─────────────────────

function GardenSummary() {
  const occupied  = useOccupiedPlotCount();
  const needWater = usePlantsNeedingWater();
  const total     = GAME.GARDEN_ROWS * GAME.GARDEN_COLS;
  const currency  = useCurrency();
  const [showShop, setShowShop] = useState(false);

  const { waterAllPlants, feedAllPlants } = useGardenActions();
  const { spendCurrency, addCurrency, buyWildSeed, buyVarietySeed, canAfford } = useInventoryActions();

  const handleBuyItem = useCallback((item: ShopItem) => {
    if (!spendCurrency(item.cost)) return;
    if (item.id === 'water_pack') {
      const count = waterAllPlants(0.35);
      showSuccess(`Watered ${count} plant${count !== 1 ? 's' : ''}`);
    } else if (item.id === 'nutrient_pack') {
      const count = feedAllPlants(0.30);
      showSuccess(`Fed ${count} plant${count !== 1 ? 's' : ''}`);
    }
  }, [spendCurrency, waterAllPlants, feedAllPlants]);

  const handleBuyWildSeed = useCallback((speciesId: string) => {
    const id = buyWildSeed(speciesId);
    if (id) showSuccess(`Wild ${speciesId} seed added`);
  }, [buyWildSeed]);

  const handleBuyVarietySeed = useCallback((varietyId: string) => {
    const id = buyVarietySeed(varietyId);
    if (id) showSuccess(`New cultivar seed added to inventory`);
  }, [buyVarietySeed]);

  return (
    <>
      <View style={styles.summaryRow}>
        <SummaryStat value={occupied}           label="Growing" color={COLORS.green_bright} />
        <View style={styles.summaryDivider} />
        <SummaryStat value={total - occupied}   label="Empty"   color={COLORS.text_secondary} />
        <View style={styles.summaryDivider} />
        <SummaryStat value={needWater.length}   label="Thirsty" color={needWater.length > 0 ? COLORS.rarity_rare : COLORS.text_muted} />
        <View style={styles.summaryDivider} />
        <Pressable style={styles.shopBtn} onPress={() => setShowShop(true)}>
          <Ionicons name="storefront-outline" size={14} color={COLORS.rarity_legendary} />
          <AppText variant="label" style={{ color: COLORS.rarity_legendary, fontSize: 9 }}>
            {currency} ✦
          </AppText>
        </Pressable>
      </View>

      <ShopModal
        visible={showShop}
        currency={currency}
        canAfford={canAfford}
        onBuyItem={handleBuyItem}
        onBuyWildSeed={handleBuyWildSeed}
        onBuyVarietySeed={handleBuyVarietySeed}
        onClose={() => setShowShop(false)}
      />
    </>
  );
}

function SummaryStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.summaryItem}>
      <AppText variant="stat" style={{ color }}>{value}</AppText>
      <AppText variant="label" color="muted">{label}</AppText>
    </View>
  );
}

// ─── Seed selection modal (plant action) ──────

function SeedPickerModal({ plotId, visible, onClose }: {
  plotId: string | null;
  visible: boolean;
  onClose: () => void;
}) {
  const seeds         = useSeeds();
  const { plantSeed } = useGardenActions();
  const { removeSeed } = useInventoryActions();

  const seedList = Object.values(seeds).filter((s) => s.quantity > 0);

  const handlePlant = useCallback((seed: SeedItem) => {
    if (!plotId) return;
    plantSeed({
      plotId,
      speciesId:  seed.speciesId,
      genotype:   seed.genotype,
      phenotype:  seed.phenotype,
      parentIds:  seed.parentIds,
      generation: seed.generation,
    });
    removeSeed(seed.id, 1);
    onClose();
  }, [plotId, plantSeed, removeSeed, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modalStyles.root}>
        <View style={modalStyles.header}>
          <AppText variant="heading" color="primary">Plant a Seed</AppText>
          <Pressable onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.text_secondary} />
          </Pressable>
        </View>

        {seedList.length === 0 ? (
          <View style={modalStyles.empty}>
            <Ionicons name="leaf-outline" size={40} color={COLORS.green_muted} />
            <AppText variant="body" color="muted" style={modalStyles.emptyText}>
              No seeds in inventory. Buy wild seeds from the shop or breed new varieties in the Lab.
            </AppText>
          </View>
        ) : (
          <ScrollView contentContainerStyle={modalStyles.list}>
            {seedList.map((seed) => (
              <Pressable
                key={seed.id}
                style={({ pressed }) => [modalStyles.seedRow, pressed && modalStyles.seedRowPressed]}
                onPress={() => handlePlant(seed)}
              >
                {/* Live mini plant preview at seed stage */}
                <View style={modalStyles.seedPreview}>
                  <PlantRenderer
                    speciesId={seed.speciesId}
                    phenotype={seed.phenotype}
                    stage="seed"
                    health={1}
                    width={52}
                    height={52}
                  />
                </View>
                <View style={modalStyles.seedInfo}>
                  <View style={modalStyles.seedTopRow}>
                    <AppText variant="subheading" color="primary">
                      {speciesLabel(seed.speciesId)}
                    </AppText>
                    <Badge variant={seed.rarity} size="sm" />
                  </View>
                  <AppText variant="caption" color="muted">
                    Gen {seed.generation} · ×{seed.quantity} available
                  </AppText>
                  <AppText variant="mono" style={modalStyles.traitHint}>
                    GR {pct(seed.phenotype.growthRate)}  ·  SZ {pct(seed.phenotype.fruitSize)}  ·  YLD {pct(seed.phenotype.yieldMultiplier / 2)}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={14} color={COLORS.text_muted} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Plant detail modal ───────────────────────

function PlantDetailModal({ plant, visible, onClose }: {
  plant: PlantInstance | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { waterPlant, addNutrients, removePlant, compostPlant } = useGardenActions();
  const { harvestPlant, addCurrency }                            = useInventoryActions();
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(null);

  if (!plant) return null;

  const handleWater = () => waterPlant(plant.id, 0.35);
  const handleFeed  = () => addNutrients(plant.id, 0.30);

  const handleHarvest = () => {
    const result = harvestPlant(plant);
    setHarvestResult(result);
    // Plot cleanup
    removePlant(plant.id);
  };

  const handleCompost = () => {
    // Small currency bonus for composting (simulates organic matter recycling)
    addCurrency(Math.floor(Math.random() * 3) + 1);
    compostPlant(plant.id);
    onClose();
  };

  const simulationSpeed = useSimulationSpeed();
  const canHarvest = plant.growthStage === 'harvest_ready' || plant.growthStage === 'mature';
  const isDead     = plant.growthStage === 'dead';
  const isDecaying = plant.growthStage === 'decaying';

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={detailStyles.root}>
          {/* Header */}
          <View style={detailStyles.header}>
            <View>
              <AppText variant="heading" color="primary">{speciesLabel(plant.speciesId)}</AppText>
              <AppText variant="caption" color="muted">
                Gen {plant.generation} · Age {plant.age} ticks
              </AppText>
            </View>
            <Pressable onPress={onClose} style={detailStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.text_secondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={detailStyles.content}>
            {/* Large plant preview */}
            <View style={detailStyles.previewBox}>
              <PlantRenderer plant={plant} width={160} height={200} />
            </View>

            {/* Badges */}
            <View style={detailStyles.badgeRow}>
              <Badge variant={plant.growthStage} />
              <Badge variant={plant.health} />
              {plant.phenotype.rarityScore >= 0.3 && (
                <Badge
                  variant={plant.phenotype.rarityScore >= 0.6 ? 'rare' : 'uncommon'}
                  size="sm"
                />
              )}
            </View>

            {/* Growth progress */}
            <Card variant="default" style={detailStyles.section}>
              <AppText variant="label" color="muted" style={detailStyles.sectionLabel}>
                Growth
              </AppText>
              <GrowthTimer plant={plant} simulationSpeed={simulationSpeed} />
            </Card>

            {/* Resource bars */}
            <Card variant="default" style={detailStyles.section}>
              <AppText variant="label" color="muted" style={detailStyles.sectionLabel}>
                Resources
              </AppText>
              <StatBar label="Water"     value={plant.waterLevel}    color={COLORS.rarity_rare} />
              <StatBar label="Nutrients" value={plant.nutrientLevel} color={COLORS.status_stressed} />
              <StatBar label="Light"     value={plant.lightLevel}    color={COLORS.rarity_legendary} />
              <StatBar label="Health"    value={plant.healthValue}   />
            </Card>

            {/* Action buttons */}
            <View style={detailStyles.actions}>
              {!isDead && !isDecaying && (
                <>
                  <ActionButton
                    icon="water-outline"
                    label="Water"
                    color={COLORS.rarity_rare}
                    onPress={handleWater}
                    disabled={plant.waterLevel > 0.85}
                  />
                  <ActionButton
                    icon="leaf-outline"
                    label="Feed"
                    color={COLORS.status_stressed}
                    onPress={handleFeed}
                    disabled={plant.nutrientLevel > 0.85}
                  />
                  {canHarvest && (
                    <ActionButton
                      icon="basket-outline"
                      label="Harvest"
                      color={COLORS.text_accent}
                      onPress={handleHarvest}
                      highlight
                    />
                  )}
                </>
              )}
              {(isDead || isDecaying) && (
                <ActionButton
                  icon="trash-outline"
                  label="Compost"
                  color={COLORS.soil_light}
                  onPress={handleCompost}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Harvest Result Modal */}
      <HarvestResultModal
        visible={!!harvestResult}
        result={harvestResult}
        speciesLabel={speciesLabel(plant.speciesId)}
        onClose={() => {
          setHarvestResult(null);
          onClose();
        }}
      />
    </>
  );
}

function ActionButton({ icon, label, color, onPress, disabled, highlight }: {
  icon: string; label: string; color: string;
  onPress: () => void; disabled?: boolean; highlight?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        detailStyles.actionBtn,
        highlight && detailStyles.actionBtnHighlight,
        pressed && !disabled && detailStyles.actionBtnPressed,
        disabled && detailStyles.actionBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon as any} size={20} color={disabled ? COLORS.text_muted : color} />
      <AppText variant="label" style={{ color: disabled ? COLORS.text_muted : color }}>
        {label}
      </AppText>
    </Pressable>
  );
}

// ─── Helpers ──────────────────────────────────

function speciesLabel(id: string): string {
  const map: Record<string, string> = {
    tomato: 'Tomato', chili: 'Chili', basil: 'Basil', radish: 'Radish',
  };
  return map[id] ?? id;
}

function pct(v: number): string {
  return `${Math.round(Math.max(0, Math.min(1, v)) * 100)}`;
}

// ─── Screen ───────────────────────────────────

export default function GardenScreen() {
  const plants = useGardenPlants();
  const [selectedPlotId, setSelectedPlotId]   = useState<string | null>(null);
  const [selectedPlant,  setSelectedPlant]    = useState<PlantInstance | null>(null);

  return (
    <ScreenShell title="Garden" subtitle="Your growing plots" scrollable={false}>
      <GardenSummary />
      <View style={styles.divider} />
      <PlotGrid
        onEmpty={(id) => setSelectedPlotId(id)}
        onOccupied={(plant) => setSelectedPlant(plant)}
      />
      {Object.keys(plants).length === 0 && (
        <Card variant="inset" style={styles.hint}>
          <Ionicons name="leaf" size={26} color={COLORS.green_muted} />
          <AppText variant="body" color="muted" style={styles.hintText}>
            Tap an empty plot to plant a seed from your inventory.
            Harvest mature plants to earn spores and extract seeds.
          </AppText>
        </Card>
      )}

      <SeedPickerModal
        plotId={selectedPlotId}
        visible={!!selectedPlotId}
        onClose={() => setSelectedPlotId(null)}
      />
      <PlantDetailModal
        plant={selectedPlant}
        visible={!!selectedPlant}
        onClose={() => setSelectedPlant(null)}
      />
    </ScreenShell>
  );
}

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['3'],
    gap: SPACING['4'],
  },
  summaryItem: { alignItems: 'center', gap: SPACING['1'] },
  summaryDivider: { width: 1, height: 28, backgroundColor: COLORS.border_subtle },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['1'],
    paddingHorizontal: SPACING['2'],
    paddingVertical: SPACING['1'],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    backgroundColor: COLORS.bg_surface,
  },
  divider: { height: 1, backgroundColor: COLORS.border_subtle, marginBottom: SPACING['4'] },
  grid:    { gap: SPACING['3'], alignItems: 'center' },
  gridRow: { flexDirection: 'row', gap: SPACING['3'] },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    borderRadius: RADIUS.lg, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  cellEmpty: {
    backgroundColor: COLORS.bg_surface,
    borderColor: COLORS.border_subtle,
    gap: SPACING['1'],
  },
  cellLocked: {
    backgroundColor: COLORS.bg_deep,
    borderColor: COLORS.border_subtle,
    opacity: 0.45,
    gap: SPACING['1'],
  },
  cellOccupied: {
    backgroundColor: COLORS.bg_surface,
    borderColor: COLORS.green_deep,
    padding: 0,
  },
  cellHarvestReady: {
    borderColor: COLORS.green_bright,
    backgroundColor: COLORS.bg_raised,
  },
  cellDead: {
    borderColor: COLORS.soil_dark,
    backgroundColor: COLORS.bg_deep,
  },
  cellPressed: { opacity: 0.72 },
  cellLabel: { fontSize: 8, letterSpacing: 1.5 },
  healthDot: {
    position: 'absolute', top: SPACING['1'], right: SPACING['1'],
    width: 6, height: 6, borderRadius: RADIUS.full, zIndex: 2,
  },
  alertRow: {
    position: 'absolute', bottom: SPACING['1'],
    flexDirection: 'row', gap: 3,
    alignItems: 'center', zIndex: 2,
  },
  stageMicro: {
    fontSize: 7,
    color: COLORS.text_muted,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  hint: { marginTop: SPACING['5'], alignItems: 'center', gap: SPACING['3'] },
  hintText: { textAlign: 'center', maxWidth: 240, lineHeight: 22 },
});

const modalStyles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg_primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING['5'], paddingTop: SPACING['5'], paddingBottom: SPACING['3'],
    borderBottomWidth: 1, borderBottomColor: COLORS.border_subtle,
  },
  closeBtn: { padding: SPACING['2'] },
  list:  { padding: SPACING['5'], gap: SPACING['2'] },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING['4'], padding: SPACING['8'] },
  emptyText: { textAlign: 'center', maxWidth: 240, lineHeight: 22 },
  seedRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING['3'],
    backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border_subtle, padding: SPACING['3'],
  },
  seedRowPressed: { backgroundColor: COLORS.bg_raised },
  seedPreview: {
    width: 52, height: 52,
    backgroundColor: COLORS.bg_deep,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
  },
  seedInfo: { flex: 1, gap: SPACING['1'] },
  seedTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  traitHint: { fontSize: 10, color: COLORS.text_muted, letterSpacing: 0.5, marginTop: 2 },
});

const detailStyles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bg_primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: SPACING['5'], paddingTop: SPACING['5'], paddingBottom: SPACING['3'],
    borderBottomWidth: 1, borderBottomColor: COLORS.border_subtle, gap: SPACING['3'],
  },
  closeBtn: { padding: SPACING['2'], marginTop: -SPACING['1'] },
  content: { padding: SPACING['5'], gap: SPACING['4'], paddingBottom: SPACING['10'] },
  previewBox: {
    alignItems: 'center', justifyContent: 'flex-end',
    height: 210,
    backgroundColor: COLORS.bg_deep,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
    overflow: 'hidden',
  },
  badgeRow:    { flexDirection: 'row', gap: SPACING['2'], flexWrap: 'wrap' },
  section:     {},
  sectionLabel: { marginBottom: SPACING['3'] },
  actions: { flexDirection: 'row', gap: SPACING['3'] },
  actionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: SPACING['2'], paddingVertical: SPACING['3'],
    borderRadius: RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.border_normal,
    backgroundColor: COLORS.bg_surface,
  },
  actionBtnHighlight: {
    borderColor: COLORS.green_primary,
    backgroundColor: COLORS.bg_overlay,
  },
  actionBtnPressed:  { opacity: 0.7 },
  actionBtnDisabled: { opacity: 0.35 },
});