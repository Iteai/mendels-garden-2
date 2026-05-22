// ─────────────────────────────────────────────
// app/(tabs)/garden.tsx
// Garden screen — complete Phase 5 game loop
// Phase 9: React.memo audit, stable selectors, StageTransitionFlash
//
// Full flow:
//   Empty plot tap → SeedPickerModal → plantFromInventory()
//   Occupied plot tap → PlantActionSheet
//     Water / Feed / Harvest / Compost / Close
//   Harvest → HarvestResultModal (yield summary)
// ─────────────────────────────────────────────

import React, { useCallback, useState, useMemo } from 'react';
import {
  View, TouchableOpacity, StyleSheet,
  Modal, ScrollView, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell, AppText, Card, Badge, StatBar, GrowthTimer, RarityPulse, HarvestJournal, StageTransitionFlash } from '../../src/components/ui';
import { PlantRenderer } from '../../src/components/plants';
import {
  useGardenPlots, useGardenPlants, useGardenActions, useSeeds,
  useSimulationSpeed,
  usePlantsNeedingWaterStable, useOccupiedPlotCountStable,
} from '../../src/store';
import {
  useGameActions, canHarvest, canCompost, shouldWater, shouldFeed, rarityFromScore,
  type HarvestSummary,
} from '../../src/game';
import { COLORS, SPACING, RADIUS, GAME, TYPOGRAPHY } from '../../src/constants/theme';
import { getSpecies } from '../../src/genetics/species';
import type { GardenPlot, PlantInstance, SeedItem } from '../../src/types';

// ─── Helpers ──────────────────────────────────

const CELL_SIZE  = 88;
const PLANT_SIZE = 72;

function speciesLabel(id: string): string {
  try { return getSpecies(id as any).displayName; }
  catch { return id.replace(/_/g, ' '); }
}

function pct(v: number): string {
  return `${Math.round(Math.max(0, Math.min(1, v)) * 100)}`;
}

function healthColor(h: PlantInstance['health']): string {
  return ({ thriving: COLORS.status_thriving, healthy: COLORS.status_healthy,
            stressed: COLORS.status_stressed, wilting: COLORS.status_wilting,
            dying: COLORS.status_dying } as Record<string,string>)[h] ?? COLORS.text_muted;
}

// ─── Plot Cells ───────────────────────────────
// Phase 9: Both cell components wrapped in React.memo — they only
// re-render when their specific plant/plot data changes, not on
// every simulation tick.

const EmptyPlotCell = React.memo(
  ({ plot, onPress }: { plot: GardenPlot; onPress: (id: string) => void }) => {
    if (plot.state === 'locked') {
      return (
        <View style={[styles.cell, styles.cellLocked]}>
          <Ionicons name="lock-closed" size={18} color={COLORS.text_muted} />
          <AppText variant="label" color="muted" style={styles.cellLabel}>locked</AppText>
        </View>
      );
    }
    return (
      <TouchableOpacity
        style={styles.cellEmpty}
        onPress={() => onPress(plot.id)}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle-outline" size={22} color={COLORS.green_muted} />
        <AppText variant="label" color="muted" style={styles.cellLabel}>plant</AppText>
      </TouchableOpacity>
    );
  },
);
EmptyPlotCell.displayName = 'EmptyPlotCell';

const OccupiedPlotCell = React.memo(
  ({ plant, onPress }: { plant: PlantInstance; onPress: (p: PlantInstance) => void }) => {
    const harvestReady = plant.growthStage === 'harvest_ready';
    const isDying      = plant.growthStage === 'dead' || plant.growthStage === 'decaying';
    const rarity       = rarityFromScore(plant.phenotype.rarityScore);

    return (
      <RarityPulse rarity={rarity} size={CELL_SIZE}>
        <TouchableOpacity
          style={[
            styles.cell, styles.cellOccupied,
            harvestReady && styles.cellHarvestReady,
            isDying && styles.cellDying,
          ]}
          onPress={() => onPress(plant)}
          activeOpacity={0.7}
        >
          {/* Phase 9: Stage transition flash — plays on every growthStage change */}
          <StageTransitionFlash stage={plant.growthStage} />
          <View style={[styles.healthDot, { backgroundColor: healthColor(plant.health) }]} />
          <PlantRenderer plant={plant} width={PLANT_SIZE} height={PLANT_SIZE} />
          <View style={styles.alertRow}>
            {shouldWater(plant) && <Ionicons name="water" size={9} color={COLORS.rarity_rare} />}
            {shouldFeed(plant)  && <Ionicons name="leaf"  size={9} color={COLORS.status_stressed} />}
            {harvestReady       && <Ionicons name="star"  size={9} color={COLORS.rarity_legendary} />}
            {isDying            && <Ionicons name="skull-outline" size={9} color={COLORS.text_muted} />}
            {!shouldWater(plant) && !shouldFeed(plant) && !harvestReady && !isDying && (
              <AppText style={styles.stageMicro}>
                {plant.growthStage.slice(0, 4).toUpperCase()}
              </AppText>
            )}
          </View>
        </TouchableOpacity>
      </RarityPulse>
    );
  },
);
OccupiedPlotCell.displayName = 'OccupiedPlotCell';

// ─── Plot Grid ────────────────────────────────

function PlotGrid({ onEmpty, onOccupied }: {
  onEmpty:    (id: string) => void;
  onOccupied: (p: PlantInstance) => void;
}) {
  const plots  = useGardenPlots();
  const plants = useGardenPlants();

  const rows = useMemo(() => {
    const r: GardenPlot[][] = [];
    for (let row = 0; row < GAME.GARDEN_ROWS; row++) {
      const cols: GardenPlot[] = [];
      for (let col = 0; col < GAME.GARDEN_COLS; col++) {
        const p = plots[`plot_${row}_${col}`];
        if (p) cols.push(p);
      }
      if (cols.length) r.push(cols);
    }
    return r;
  }, [plots]);

  return (
    <View style={styles.grid}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.gridRow}>
          {row.map((plot) => {
            if (plot.state === 'occupied' && plot.plantId) {
              const plant = plants[plot.plantId];
              if (plant) return <OccupiedPlotCell key={plot.id} plant={plant} onPress={onOccupied} />;
            }
            return <EmptyPlotCell key={plot.id} plot={plot} onPress={onEmpty} />;
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Summary strip ────────────────────────────

// Phase 9: GardenSummary uses stable selectors — re-renders only when
// occupied count or thirsty plant count actually changes.
function GardenSummary() {
  const occupied  = useOccupiedPlotCountStable();
  const needWater = usePlantsNeedingWaterStable();
  const total     = GAME.GARDEN_ROWS * GAME.GARDEN_COLS;

  return (
    <View style={styles.summaryRow}>
      <SummaryStat value={occupied}          label="Growing"  color={COLORS.green_bright} />
      <View style={styles.summaryDivider} />
      <SummaryStat value={total - occupied}  label="Empty"    color={COLORS.text_secondary} />
      <View style={styles.summaryDivider} />
      <SummaryStat value={needWater.length}  label="Thirsty"  color={needWater.length > 0 ? COLORS.rarity_rare : COLORS.text_muted} />
    </View>
  );
}

// Phase 9: memoised — only re-renders when value/label/color prop changes.
const SummaryStat = React.memo(
  ({ value, label, color }: { value: number; label: string; color: string }) => (
    <View style={styles.summaryItem}>
      <AppText variant="stat" style={{ color }}>{value}</AppText>
      <AppText variant="label" color="muted">{label}</AppText>
    </View>
  ),
);
SummaryStat.displayName = 'SummaryStat';

// ─── Seed Picker Modal ────────────────────────

function SeedPickerModal({ plotId, visible, onClose }: {
  plotId: string | null; visible: boolean; onClose: () => void;
}) {
  const seeds = useSeeds();
  const { plantFromInventory } = useGameActions();

  const seedList = useMemo(
    () => Object.values(seeds).filter((s) => s.quantity > 0)
               .sort((a, b) => b.phenotype.rarityScore - a.phenotype.rarityScore),
    [seeds],
  );

  const handlePlant = useCallback((seed: SeedItem) => {
    if (!plotId) return;
    const result = plantFromInventory(seed.id, plotId);
    if (result.ok) onClose();
  }, [plotId, plantFromInventory, onClose]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modalStyles.root}>
        <View style={modalStyles.header}>
          <AppText variant="heading" color="primary">Choose a Seed</AppText>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={COLORS.text_secondary} />
          </TouchableOpacity>
        </View>

        {seedList.length === 0 ? (
          <View style={modalStyles.empty}>
            <Ionicons name="leaf-outline" size={40} color={COLORS.green_muted} />
            <AppText variant="body" color="muted" style={modalStyles.emptyText}>
              No seeds in inventory.{'\n'}Breed new varieties in the Lab.
            </AppText>
          </View>
        ) : (
          <FlatList
            data={seedList}
            keyExtractor={(s) => s.id}
            contentContainerStyle={modalStyles.list}
            renderItem={({ item: seed }) => (
              <TouchableOpacity
                style={modalStyles.seedRow}
                onPress={() => handlePlant(seed)}
                activeOpacity={0.7}
              >
                {/* Mini preview */}
                <View style={modalStyles.preview}>
                  <PlantRenderer speciesId={seed.speciesId} phenotype={seed.phenotype}
                    stage="seed" health={1} width={52} height={52} />
                </View>
                <View style={modalStyles.seedInfo}>
                  <View style={modalStyles.seedTop}>
                    <AppText variant="subheading" color="primary">{speciesLabel(seed.speciesId)}</AppText>
                    <Badge variant={seed.rarity} size="sm" />
                  </View>
                  <AppText variant="caption" color="muted">Gen {seed.generation} · ×{seed.quantity}</AppText>
                  <AppText variant="mono" style={modalStyles.traitRow}>
                    GR {pct(seed.phenotype.growthRate)}  ·  SZ {pct(seed.phenotype.fruitSize)}  ·  YLD {pct(seed.phenotype.yieldMultiplier / 2)}
                  </AppText>
                </View>
                <Ionicons name="arrow-forward-circle-outline" size={22} color={COLORS.green_primary} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Plant Action Sheet ───────────────────────

function PlantActionSheet({ plant, visible, onClose, onHarvestDone }: {
  plant: PlantInstance | null;
  visible: boolean;
  onClose: () => void;
  onHarvestDone: (summary: HarvestSummary) => void;
}) {
  const { waterPlant, addNutrients }                 = useGardenActions();
  const { harvestPlant, compostPlant }               = useGameActions();
  const simulationSpeed                               = useSimulationSpeed();

  if (!plant) return null;

  const doWater   = () => { waterPlant(plant.id, 0.40); };
  const doFeed    = () => { addNutrients(plant.id, 0.35); };
  const doHarvest = () => {
    const summary = harvestPlant(plant.id);
    if (summary) { onHarvestDone(summary); onClose(); }
  };
  const doCompost = () => {
    compostPlant(plant.id);
    onClose();
  };

  const harvestable = canHarvest(plant);
  const compostable = canCompost(plant);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={sheetStyles.overlay} onPress={onClose} activeOpacity={1}>
        <View>
          {/* Handle bar */}
          <View style={sheetStyles.handle} />

          {/* Plant preview */}
          <View style={sheetStyles.previewRow}>
            <View style={sheetStyles.svgBox}>
              <PlantRenderer plant={plant} width={110} height={130} />
            </View>
            <View style={sheetStyles.previewInfo}>
              <AppText variant="heading" color="primary">{speciesLabel(plant.speciesId)}</AppText>
              <View style={sheetStyles.badgeRow}>
                <Badge variant={plant.growthStage} size="sm" />
                <Badge variant={plant.health} size="sm" />
              </View>
              <GrowthTimer plant={plant} simulationSpeed={simulationSpeed} compact />
            </View>
          </View>

          {/* Resource bars */}
          <View style={sheetStyles.resources}>
            <ResourceMini label="💧" value={plant.waterLevel}    color={COLORS.rarity_rare} />
            <ResourceMini label="🌿" value={plant.nutrientLevel} color={COLORS.status_stressed} />
            <ResourceMini label="☀️" value={plant.lightLevel}    color={COLORS.rarity_legendary} />
            <ResourceMini label="❤️" value={plant.healthValue}   color={healthColor(plant.health)} />
          </View>

          {/* Actions */}
          <View style={sheetStyles.actions}>
            <ActionBtn icon="water-outline"   label="Water"
              color={COLORS.rarity_rare}      onPress={doWater}
              disabled={plant.waterLevel > 0.88} />
            <ActionBtn icon="leaf-outline"    label="Feed"
              color={COLORS.status_stressed}  onPress={doFeed}
              disabled={plant.nutrientLevel > 0.88} />
            {harvestable && (
              <ActionBtn icon="basket-outline" label="Harvest"
                color={COLORS.text_accent}    onPress={doHarvest}
                highlight />
            )}
            {compostable && (
              <ActionBtn icon="trash-outline" label="Compost"
                color={COLORS.terra_primary}  onPress={doCompost} />
            )}
          </View>

          <TouchableOpacity style={sheetStyles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="label" color="muted">Close</AppText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function ResourceMini({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <View style={sheetStyles.resMini}>
      <AppText style={sheetStyles.resEmoji}>{label}</AppText>
      <View style={sheetStyles.resTrack}>
        <View style={[sheetStyles.resFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <AppText variant="mono" style={[sheetStyles.resPct, { color }]}>{pct}</AppText>
    </View>
  );
}

function ActionBtn({ icon, label, color, onPress, disabled, highlight }: {
  icon: string; label: string; color: string;
  onPress: () => void; disabled?: boolean; highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        sheetStyles.actionBtn,
        highlight && sheetStyles.actionBtnHighlight,
        disabled && sheetStyles.actionBtnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={20} color={disabled ? COLORS.text_muted : color} />
      <AppText variant="label" style={{ color: disabled ? COLORS.text_muted : color }}>{label}</AppText>
    </TouchableOpacity>
  );
}

// ─── Harvest Result Modal ─────────────────────

function HarvestResultModal({ summary, visible, onClose }: {
  summary: HarvestSummary | null; visible: boolean; onClose: () => void;
}) {
  if (!summary) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={resultStyles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={resultStyles.card}>
          <AppText variant="heading" color="accent" style={resultStyles.title}>
            Harvested!
          </AppText>

          <View style={resultStyles.row}>
            <AppText variant="body" color="secondary">Species</AppText>
            <AppText variant="mono" color="primary">{speciesLabel(summary.speciesId)}</AppText>
          </View>
          <View style={resultStyles.divider} />
          <View style={resultStyles.row}>
            <AppText variant="body" color="secondary">Yield</AppText>
            <AppText variant="stat" color="green">{summary.yield.quantity}</AppText>
          </View>
          <View style={resultStyles.row}>
            <AppText variant="body" color="secondary">Quality</AppText>
            <AppText variant="mono" color="primary">{Math.round(summary.yield.quality * 100)}%</AppText>
          </View>
          <View style={resultStyles.row}>
            <AppText variant="body" color="secondary">Seeds recovered</AppText>
            <AppText variant="mono" color="primary">×{summary.seedsObtained}</AppText>
          </View>
          <View style={resultStyles.divider} />
          <View style={resultStyles.rewardRow}>
            <AppText variant="subheading" color="accent">+{summary.currencyEarned} ✦ Spores</AppText>
          </View>

          <TouchableOpacity style={resultStyles.btn} onPress={onClose} activeOpacity={0.7}>
            <AppText variant="label" color="accent">Continue</AppText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────

export default function GardenScreen() {
  const plants                    = useGardenPlants();
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [activePlant,    setActivePlant]    = useState<PlantInstance | null>(null);
  const [harvestSummary, setHarvestSummary] = useState<HarvestSummary | null>(null);

  const handleOccupied = useCallback((plant: PlantInstance) => {
    setActivePlant(plant);
  }, []);

  return (
    <ScreenShell title="Garden" subtitle="Your growing plots" scrollable={true}>
      <GardenSummary />
      <View style={styles.divider} />
      <PlotGrid
        onEmpty={(id)    => setSelectedPlotId(id)}
        onOccupied={handleOccupied}
      />

      {Object.keys(plants).length === 0 && (
        <Card variant="inset" style={styles.hint}>
          <Ionicons name="leaf" size={26} color={COLORS.green_muted} />
          <AppText variant="body" color="muted" style={styles.hintText}>
            Tap an empty plot to plant a seed.{'\n'}Check your Seeds tab for starter tomatoes.
          </AppText>
        </Card>
      )}

      {/* Phase 7: Harvest Journal — collapsible history */}
      <View style={styles.journalSpacer} />
      <HarvestJournal />

      <SeedPickerModal
        plotId={selectedPlotId}
        visible={!!selectedPlotId}
        onClose={() => setSelectedPlotId(null)}
      />

      <PlantActionSheet
        plant={activePlant}
        visible={!!activePlant}
        onClose={() => setActivePlant(null)}
        onHarvestDone={(s) => { setHarvestSummary(s); }}
      />

      <HarvestResultModal
        summary={harvestSummary}
        visible={!!harvestSummary}
        onClose={() => setHarvestSummary(null)}
      />
    </ScreenShell>
  );
}

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  summaryRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING['3'], gap: SPACING['4'] },
  summaryItem:     { alignItems: 'center', gap: SPACING['1'] },
  summaryDivider:  { width: 1, height: 28, backgroundColor: COLORS.border_subtle },
  divider:         { height: 1, backgroundColor: COLORS.border_subtle, marginBottom: SPACING['4'] },
  grid:            { gap: SPACING['3'], alignItems: 'center' },
  gridRow:         { flexDirection: 'row', gap: SPACING['3'] },
  cell:            { width: CELL_SIZE, height: CELL_SIZE, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  cellEmpty:       { width: CELL_SIZE, height: CELL_SIZE, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', backgroundColor: COLORS.bg_surface, borderColor: COLORS.border_subtle, gap: SPACING['1'] },
  cellLocked:      { backgroundColor: COLORS.bg_deep, borderColor: COLORS.border_subtle, opacity: 0.42, gap: SPACING['1'] },
  cellOccupied:    { backgroundColor: COLORS.bg_surface, borderColor: COLORS.green_deep, padding: 0 },
  cellHarvestReady:{ borderColor: COLORS.green_bright, backgroundColor: COLORS.bg_raised },
  cellDying:       { borderColor: COLORS.soil_mid, opacity: 0.75 },
  cellLabel:       { fontSize: 8, letterSpacing: 1.5 },
  healthDot:       { position: 'absolute', top: SPACING['1'], right: SPACING['1'], width: 6, height: 6, borderRadius: RADIUS.full, zIndex: 2 },
  alertRow:        { position: 'absolute', bottom: SPACING['1'], flexDirection: 'row', gap: 3, alignItems: 'center', zIndex: 2 },
  stageMicro:      { fontSize: 7, color: COLORS.text_muted, fontWeight: '700', letterSpacing: 0.8 },
  hint:            { marginTop: SPACING['5'], alignItems: 'center', gap: SPACING['3'] },
  hintText:        { textAlign: 'center', maxWidth: 240, lineHeight: 22 },
  journalSpacer:   { height: SPACING['5'] },
});

const modalStyles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: COLORS.bg_primary },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING['5'], paddingTop: SPACING['5'], paddingBottom: SPACING['3'], borderBottomWidth: 1, borderBottomColor: COLORS.border_subtle },
  closeBtn:      { padding: SPACING['2'] },
  list:          { padding: SPACING['5'], gap: SPACING['3'] },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING['4'], padding: SPACING['8'] },
  emptyText:     { textAlign: 'center', maxWidth: 240, lineHeight: 22 },
  seedRow:       { flexDirection: 'row', alignItems: 'center', gap: SPACING['3'], backgroundColor: COLORS.bg_surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border_subtle, padding: SPACING['3'] },
  seedRowPressed:{ backgroundColor: COLORS.bg_raised },
  preview:       { width: 52, height: 52, backgroundColor: COLORS.bg_deep, borderRadius: RADIUS.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 },
  seedInfo:      { flex: 1, gap: SPACING['1'] },
  seedTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  traitRow:      { fontSize: 10, color: COLORS.text_muted, letterSpacing: 0.5, marginTop: 2 },
});

const sheetStyles = StyleSheet.create({
  overlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  sheet:               { backgroundColor: COLORS.bg_surface, borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], borderTopWidth: 1, borderColor: COLORS.border_normal, padding: SPACING['5'], paddingBottom: SPACING['8'], gap: SPACING['4'] },
  handle:              { width: 36, height: 4, backgroundColor: COLORS.border_normal, borderRadius: RADIUS.full, alignSelf: 'center', marginBottom: SPACING['2'] },
  previewRow:          { flexDirection: 'row', alignItems: 'center', gap: SPACING['4'] },
  svgBox:              { width: 110, height: 130, backgroundColor: COLORS.bg_deep, borderRadius: RADIUS.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 },
  previewInfo:         { flex: 1, gap: SPACING['2'] },
  badgeRow:            { flexDirection: 'row', gap: SPACING['2'] },
  resources:           { gap: SPACING['2'] },
  resMini:             { flexDirection: 'row', alignItems: 'center', gap: SPACING['2'] },
  resEmoji:            { fontSize: 13, width: 20, textAlign: 'center' },
  resTrack:            { flex: 1, height: 4, backgroundColor: COLORS.bg_overlay, borderRadius: RADIUS.full, overflow: 'hidden' },
  resFill:             { height: '100%', borderRadius: RADIUS.full },
  resPct:              { width: 28, textAlign: 'right', fontSize: 10 },
  actions:             { flexDirection: 'row', gap: SPACING['3'], flexWrap: 'wrap' },
  actionBtn:           { flex: 1, minWidth: 70, alignItems: 'center', justifyContent: 'center', gap: SPACING['1'], paddingVertical: SPACING['3'], borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border_normal, backgroundColor: COLORS.bg_raised },
  actionBtnHighlight:  { borderColor: COLORS.green_primary, backgroundColor: COLORS.bg_overlay },
  actionBtnDisabled:   { opacity: 0.32 },
  closeBtn:            { alignItems: 'center', paddingVertical: SPACING['2'] },
});

const resultStyles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center' },
  card:       { width: '82%', backgroundColor: COLORS.bg_surface, borderRadius: RADIUS['2xl'], borderWidth: 1, borderColor: COLORS.green_deep, padding: SPACING['6'], gap: SPACING['3'] },
  title:      { textAlign: 'center', marginBottom: SPACING['2'] },
  row:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider:    { height: 1, backgroundColor: COLORS.border_subtle },
  rewardRow:  { alignItems: 'center', paddingVertical: SPACING['2'] },
  btn:        { alignItems: 'center', paddingVertical: SPACING['3'], marginTop: SPACING['2'], borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.green_deep, backgroundColor: COLORS.bg_overlay },
});