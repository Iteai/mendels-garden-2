// ─────────────────────────────────────────────
// app/(tabs)/_layout.tsx
// Tab navigator + foreground simulation loop
// Phase 4: collects SimulationEvents, exposes
//          harvest-ready badge on Garden tab
// Phase 8: simulation events → push notifications
// ─────────────────────────────────────────────

import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { TabBar }              from '../../src/components/ui/TabBar';
import { useGardenActions, useAppStore, useHarvestReadyPlants } from '../../src/store';
import { GAME }                from '../../src/constants/theme';
import { getVariety }          from '../../src/genetics/varieties';
import { getSpecies }          from '../../src/genetics/species';
import {
  scheduleHarvestReadyNotification,
  scheduleWaterCriticalNotification,
  schedulePlantDiedNotification,
} from '../../src/simulation/notifications';
import type { SimulationEvent } from '../../src/simulation';

// ─── Plant Name Helper ────────────────────────

function getPlantLabel(plantId: string): string {
  const state = useAppStore.getState();
  const plant = state.plants[plantId];
  if (!plant) return 'A plant';

  let name = '';
  try {
    const vari = getVariety(plant.varietyId);
    name = vari.displayName;
  } catch {
    name = getSpecies(plant.speciesId).displayName;
  }
  return `${name} ${getSpecies(plant.speciesId).displayName}`;
}

// ─── Simulation Loop ──────────────────────────
// Runs a setInterval while the app is foregrounded.
// Each interval fires one tick (scaled by simulationSpeed).
// Events are routed to push notifications when enabled.

function SimulationLoop() {
  const { tickSimulation, setLastSimulatedAt } = useGardenActions();
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef        = useRef(simulationSpeed);
  const notifRef        = useRef(notificationsEnabled);

  // Keep refs current without restarting the interval
  useEffect(() => { speedRef.current = simulationSpeed; }, [simulationSpeed]);
  useEffect(() => { notifRef.current = notificationsEnabled; }, [notificationsEnabled]);

  const runTick = useCallback(() => {
    const events: SimulationEvent[] = tickSimulation(speedRef.current);
    setLastSimulatedAt(Date.now());

    // Route events to push notifications when enabled
    if (notifRef.current) {
      for (const event of events) {
        const plantLabel = getPlantLabel(event.plantId);
        switch (event.type) {
          case 'harvest_ready':
            scheduleHarvestReadyNotification(event.plantId, plantLabel);
            break;
          case 'water_critical':
            scheduleWaterCriticalNotification(event.plantId, plantLabel);
            break;
          case 'plant_died':
            schedulePlantDiedNotification(event.plantId, plantLabel);
            break;
        }
      }
    }

    // Dev logging
    if (__DEV__) {
      events
        .filter((e) => e.type === 'harvest_ready' || e.type === 'plant_died')
        .forEach((e) => console.log(`[Sim] ${e.type} → ${e.plantId}`));
    }
  }, [tickSimulation, setLastSimulatedAt]);

  useEffect(() => {
    intervalRef.current = setInterval(runTick, GAME.SIMULATION_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runTick]);

  return null;
}

// ─── Harvest badge ────────────────────────────
// Renders on the Garden tab icon when plants are ready.

function HarvestBadge() {
  const readyPlants = useHarvestReadyPlants();
  if (readyPlants.length === 0) return null;

  return (
    <View style={badge.container}>
      <View style={badge.dot} />
    </View>
  );
}

const badge = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#C4D97A',
  },
});

// ─── Tab Layout ───────────────────────────────

export default function TabLayout() {
  return (
    <>
      <SimulationLoop />
      <Tabs
        tabBar={(props: any) => <TabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="garden"    options={{ title: 'Garden' }} />
        <Tabs.Screen name="inventory" options={{ title: 'Seeds' }} />
        <Tabs.Screen name="lab"       options={{ title: 'Lab' }} />
        <Tabs.Screen name="settings"  options={{ title: 'Settings' }} />
      </Tabs>
    </>
  );
}
