// ─────────────────────────────────────────────
// app/(tabs)/_layout.tsx
// Tab navigator + foreground simulation loop
// Phase 4: collects SimulationEvents, exposes
//          harvest-ready badge on Garden tab
// Phase 8: routes harvest_ready / plant_died
//          events to local notifications
// ─────────────────────────────────────────────

import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { TabBar }              from '../../src/components/ui/TabBar';
import { useGardenActions, useAppStore, useHarvestReadyPlants } from '../../src/store';
import { GAME }                from '../../src/constants/theme';
import type { SimulationEvent } from '../../src/simulation';

// ─── Notification helpers ─────────────────────
// Expo SDK includes expo-notifications; we schedule
// local notifications for notable simulation events.

let Notifications: any = null;
try {
  // Lazy import — notifications module may not be available
  // on all Expo builds (e.g. Expo Go restricts some modules)
  Notifications = require('expo-notifications');
} catch {
  // Notifications not available — safe fallback
}

async function scheduleNotification(title: string, body: string) {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null, // fire immediately
    });
  } catch {
    // silent
  }
}

// Request notification permissions on mount
function requestNotificationPermissions() {
  if (!Notifications) return;
  Notifications.requestPermissionsAsync().catch(() => {});
}

// ─── Simulation Loop ──────────────────────────
// Runs a setInterval while the app is foregrounded.
// Each interval fires one tick (scaled by simulationSpeed).
// Phase 8: notable events trigger local notifications.

function SimulationLoop() {
  const { tickSimulation, setLastSimulatedAt } = useGardenActions();
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);
  const intervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef        = useRef(simulationSpeed);

  // Keep speedRef current without restarting the interval
  useEffect(() => { speedRef.current = simulationSpeed; }, [simulationSpeed]);

  // Request permissions once on mount
  useEffect(() => { requestNotificationPermissions(); }, []);

  const runTick = useCallback(() => {
    const events: SimulationEvent[] = tickSimulation(speedRef.current);
    setLastSimulatedAt(Date.now());

    // Route notable events to notifications
    events
      .filter((e) => e.type === 'harvest_ready' || e.type === 'plant_died')
      .forEach((e) => {
        if (e.type === 'harvest_ready') {
          scheduleNotification(
            '🌿 Harvest Ready!',
            `A plant in your garden is ready to harvest.`,
          );
        } else if (e.type === 'plant_died') {
          scheduleNotification(
            '⚠️ Plant Lost',
            `A plant in your garden has died. Compost it to free the plot.`,
          );
        }

        // Dev logging
        if (__DEV__) console.log(`[Sim] ${e.type} → ${e.plantId}`);
      });
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
        tabBar={(props) => <TabBar {...props} />}
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
