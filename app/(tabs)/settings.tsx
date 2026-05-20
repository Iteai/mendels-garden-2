// ─────────────────────────────────────────────
// app/(tabs)/settings.tsx
// Settings screen — preferences and debug info
// Phase 7: collection stats, legendary count
// ─────────────────────────────────────────────

import React, { useMemo } from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell, AppText, Card, PressableRow } from '../../src/components/ui';
import {
  useAppStore,
  useSettingsActions,
  useSeeds,
  useGardenPlants,
  useCurrency,
  useJournalEntries,
} from '../../src/store';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import { VARIETY_REGISTRY } from '../../src/genetics/varieties';
import { asIconName, type IoniconName } from '../../src/utils/formatters';
import type { JournalEntry, PlantInstance, SeedItem } from '../../src/types';

// ─── Setting Row ──────────────────────────────

type SettingRowProps = {
  icon: IoniconName;
  label: string;
  description?: string;
  right?: React.ReactNode;
};

function SettingRow({ icon, label, description, right }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={18} color={COLORS.green_primary} />
      </View>
      <View style={styles.settingContent}>
        <AppText variant="body" color="primary">{label}</AppText>
        {description ? (
          <AppText variant="caption" color="muted">{description}</AppText>
        ) : null}
      </View>
      {right && <View style={styles.settingRight}>{right}</View>}
    </View>
  );
}

// ─── Speed Selector ───────────────────────────

const SPEED_OPTIONS = [0.5, 1, 2, 5, 10];

function SpeedSelector() {
  const speed = useAppStore((s) => s.simulationSpeed);
  const { setSimulationSpeed } = useSettingsActions();

  return (
    <View style={styles.speedRow}>
      {SPEED_OPTIONS.map((opt) => (
        <View
          key={opt}
          style={[
            styles.speedBtn,
            speed === opt && styles.speedBtnActive,
          ]}
        >
          <AppText
            variant="label"
            style={{
              color: speed === opt ? COLORS.text_accent : COLORS.text_muted,
            }}
            onPress={() => setSimulationSpeed(opt)}
          >
            {opt}×
          </AppText>
        </View>
      ))}
    </View>
  );
}

// ─── Stats Overview ───────────────────────────

function StatsOverview() {
  const seeds = useSeeds();
  const plants = useGardenPlants();
  const currency = useCurrency();
  const journalEntries = useJournalEntries();
  const totalVarieties = Object.keys(VARIETY_REGISTRY).length;
  const discoveredCount = Object.keys(journalEntries).length;

  // Memoize expensive calculations to avoid re-filtering on every render
  const legendaryCount = useMemo(
    () => Object.values(journalEntries).filter((e: JournalEntry) => e.bestRarityScore >= 0.85).length,
    [journalEntries]
  );

  const totalSeeds = useMemo(
    () => Object.values(seeds).reduce((s: number, i: SeedItem) => s + i.quantity, 0),
    [seeds]
  );

  const stats = [
    { label: 'Plants',      value: Object.keys(plants).length },
    { label: 'Seeds',       value: totalSeeds },
    { label: 'Spores ✦',    value: currency },
    { label: 'Collection',  value: `${discoveredCount}/${totalVarieties}` },
  ];

  return (
    <Card variant="inset" style={styles.statsCard}>
      {stats.map((s, i) => (
        <View key={i} style={styles.statRow}>
          <AppText variant="label" color="muted">{s.label}</AppText>
          <AppText variant="mono" color="accent">{s.value}</AppText>
        </View>
      ))}
      {legendaryCount > 0 && (
        <View style={styles.legendaryRow}>
          <AppText variant="caption" color="accent">
            🌟 {legendaryCount} legendary {legendaryCount === 1 ? 'variety' : 'varieties'} discovered!
          </AppText>
        </View>
      )}
    </Card>
  );
}

// ─── Simulation Info ──────────────────────────

function SimulationInfo() {
  const speed    = useAppStore((s) => s.simulationSpeed);
  const plants = useGardenPlants();

  // Memoize living plant count calculation
  const living = useMemo(
    () => Object.values(plants).filter((p: PlantInstance) => p.growthStage !== 'dead').length,
    [plants]
  );

  // At current speed, how long does 1 tomato lifecycle take?
  // Tomato total ticks ≈ 12+24+36+30+24 = 126 base ticks
  const TOMATO_LIFECYCLE_TICKS = 126;
  const realSeconds = (TOMATO_LIFECYCLE_TICKS / speed) * 5;
  const timeStr = realSeconds < 60
    ? `${Math.round(realSeconds)}s`
    : realSeconds < 3600
      ? `${Math.round(realSeconds / 60)}m`
      : `${(realSeconds / 3600).toFixed(1)}h`;

  return (
    <Card variant="inset" style={simStyles.card}>
      <AppText variant="label" color="muted" style={simStyles.label}>
        Simulation Info
      </AppText>
      <View style={simStyles.row}>
        <AppText variant="caption" color="secondary">Active plants</AppText>
        <AppText variant="mono" color="accent">{living}</AppText>
      </View>
      <View style={simStyles.row}>
        <AppText variant="caption" color="secondary">Tick interval</AppText>
        <AppText variant="mono" color="secondary">{(5 / speed).toFixed(1)}s real</AppText>
      </View>
      <View style={simStyles.row}>
        <AppText variant="caption" color="secondary">Tomato lifecycle</AppText>
        <AppText variant="mono" color="secondary">~{timeStr}</AppText>
      </View>
    </Card>
  );
}

const simStyles = StyleSheet.create({
  card: { gap: SPACING['2'] },
  label: { marginBottom: SPACING['1'] },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
});

// ─── Screen ───────────────────────────────────

export default function SettingsScreen() {
  const soundEnabled = useAppStore((s) => s.soundEnabled);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const { setSoundEnabled, setNotificationsEnabled } = useSettingsActions();

  return (
    <ScreenShell title="Settings" subtitle="Configuration">

      {/* Game Stats */}
      <AppText variant="label" color="muted" style={styles.sectionLabel}>
        Overview
      </AppText>
      <StatsOverview />

      {/* Simulation */}
      <AppText variant="label" color="muted" style={styles.sectionLabel}>
        Simulation
      </AppText>
      <Card variant="default" style={styles.settingsGroup}>
        <SettingRow
          icon="speedometer-outline"
          label="Simulation Speed"
          description="How fast plants grow"
          right={<SpeedSelector />}
        />
      </Card>

      {/* Simulation info */}
      <SimulationInfo />

      {/* Preferences */}
      <AppText variant="label" color="muted" style={styles.sectionLabel}>
        Preferences
      </AppText>
      <Card variant="default" style={styles.settingsGroup}>
        <SettingRow
          icon="volume-medium-outline"
          label="Sound Effects"
          right={
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              thumbColor={soundEnabled ? COLORS.green_primary : COLORS.text_muted}
              trackColor={{
                false: COLORS.bg_overlay,
                true: COLORS.green_deep,
              }}
            />
          }
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="notifications-outline"
          label="Notifications"
          description="Harvest ready alerts"
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={notificationsEnabled ? COLORS.green_primary : COLORS.text_muted}
              trackColor={{
                false: COLORS.bg_overlay,
                true: COLORS.green_deep,
              }}
            />
          }
        />
      </Card>

      {/* About */}
      <AppText variant="label" color="muted" style={styles.sectionLabel}>
        About
      </AppText>
      <Card variant="default" style={styles.settingsGroup}>
        <SettingRow
          icon="leaf"
          label="Plant Genetics"
          description="v1.0.0 — All 7 phases"
        />
        <View style={styles.settingDivider} />
        <SettingRow
          icon="code-outline"
          label="Built with Expo + Zustand"
          description="react-native-svg rendering · TypeScript"
        />
      </Card>

    </ScreenShell>
  );
}

// ─── Styles ───────────────────────────────────

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: SPACING['2'],
    marginTop: SPACING['4'],
  },
  statsCard: {
    gap: SPACING['2'],
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING['1'],
  },
  legendaryRow: {
    paddingTop: SPACING['1'],
    alignItems: 'center',
  },
  settingsGroup: {
    gap: 0,
    padding: 0,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['3'],
    paddingHorizontal: SPACING['4'],
    paddingVertical: SPACING['3'],
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg_deep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingRight: {
    flexShrink: 0,
  },
  settingDivider: {
    height: 1,
    backgroundColor: COLORS.border_subtle,
    marginHorizontal: SPACING['4'],
  },
  speedRow: {
    flexDirection: 'row',
    gap: SPACING['1'],
  },
  speedBtn: {
    paddingHorizontal: SPACING['2'],
    paddingVertical: SPACING['1'],
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg_deep,
    borderWidth: 1,
    borderColor: COLORS.border_subtle,
  },
  speedBtnActive: {
    backgroundColor: COLORS.bg_overlay,
    borderColor: COLORS.green_deep,
  },
});