// ─────────────────────────────────────────────
// app/_layout.tsx
// Root layout — Expo Router entry point
// Phase 8: AsyncStorage restore + auto-save
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS, TYPOGRAPHY, GAME } from '../src/constants/theme';
import {
  useAppStore,
  useGardenActions,
  useInventoryActions,
  useSettingsActions,
  useInventoryInitialised,
  type AppStore,
} from '../src/store';
import {
  loadGameState,
  autoSaveMiddleware,
} from '../src/store/persistence';
import { Slot } from 'expo-router';

// ─── Splash / Loading Screen ─────────────────

function LoadingScreen() {
  return (
    <View style={loadingStyles.root}>
      <Text style={loadingStyles.icon}>🌱</Text>
      <Text style={loadingStyles.title}>Plant Genetics</Text>
      <ActivityIndicator size="small" color={COLORS.green_bright} />
      <Text style={loadingStyles.sub}>Loading your garden...</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg_deep,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: TYPOGRAPHY.size['2xl'],
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text_accent,
    letterSpacing: 2,
  },
  sub: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.text_muted,
  },
});

// ─── App Initialiser ─────────────────────────
// Phase 8: tries AsyncStorage restore first,
//           falls back to fresh initialisation.
// Phase 9: uses async chunked simulation for large offline catch-ups
//           to avoid blocking the JS thread on startup.

function AppInitialiser() {
  const { initGarden, tickSimulation, tickSimulationAsync, setLastSimulatedAt } = useGardenActions();
  const { initStartingInventory } = useInventoryActions();
  const { markInventoryInitialised } = useSettingsActions();

  const lastSimulatedAt      = useAppStore((s) => s.lastSimulatedAt);
  const simulationSpeed      = useAppStore((s) => s.simulationSpeed);
  const inventoryInitialised = useInventoryInitialised();

  useEffect(() => {
    async function init() {
      // 1. Initialise garden grid (no-op if already exists)
      initGarden();

      // 2. Seed starting inventory on first ever launch
      if (!inventoryInitialised) {
        initStartingInventory();
        markInventoryInitialised();
      }

      // 3. Offline catch-up simulation
      // Phase 9: for large tick counts (> SIM_CHUNK_SIZE) use the async
      // chunked variant to avoid blocking the JS thread during app startup.
      const now          = Date.now();
      const elapsedMs    = now - lastSimulatedAt;
      const elapsedTicks = Math.floor((elapsedMs / 5000) * simulationSpeed);

      if (elapsedTicks > 0) {
        if (elapsedTicks > GAME.SIM_CHUNK_SIZE) {
          await tickSimulationAsync(elapsedTicks);
        } else {
          tickSimulation(elapsedTicks);
        }
      }

      setLastSimulatedAt(now);
    }

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ─── Root Layout ──────────────────────────────

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        // 1. Try to restore saved state from AsyncStorage
        const savedState = await loadGameState();

        if (savedState) {
          // Restore all slices in one batch
          useAppStore.setState({
            // Garden slice
            plots: savedState.garden.plots,
            plants: savedState.garden.plants,
            lastSimulatedAt: savedState.garden.lastSimulatedAt,
            // Inventory slice
            seeds: savedState.inventory.seeds,
            harvests: savedState.inventory.harvests,
            currency: savedState.inventory.currency,
            // Settings slice
            simulationSpeed: savedState.settings.simulationSpeed,
            notificationsEnabled: savedState.settings.notificationsEnabled,
            soundEnabled: savedState.settings.soundEnabled,
            tutorialComplete: savedState.settings.tutorialComplete,
            inventoryInitialised: savedState.settings.inventoryInitialised,
          });
        }

        // 2. Start auto-save middleware (debounced, throttled)
        autoSaveMiddleware({
          getState: () => useAppStore.getState() as any,
          setState: () => {},
          subscribe: useAppStore.subscribe,
        });
      } catch {
        // Errors are logged inside loadGameState; proceed with fresh state
      }

      setReady(true);
    }

    bootstrap();
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.bg_deep} />
        <AppInitialiser />
        <Slot />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg_deep,
  },
});
