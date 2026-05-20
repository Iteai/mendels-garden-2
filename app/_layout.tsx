// ─────────────────────────────────────────────
// app/_layout.tsx
// Root layout — Expo Router entry point
// ─────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from '../src/constants/theme';
import {
  useAppStore,
  useGardenActions,
  useInventoryActions,
  useSettingsActions,
  useInventoryInitialised,
} from '../src/store';
import {
  loadSavedState,
  subscribeAutosave,
  type PersistedState,
} from '../src/store/persistence';
import { initNotifications } from '../src/simulation/notifications';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

// ─── App Initialiser ─────────────────────────
// Runs once on mount:
//  1. Restore saved state (if any)
//  2. Ensure garden plots exist
//  3. Seed starting inventory on first launch
//  4. Apply offline catch-up ticks
//  5. Wire autosave
//  6. Init notifications

function AppInitialiser() {
  const { initGarden, tickSimulation, setLastSimulatedAt } = useGardenActions();
  const { initStartingInventory, addSeed, addHarvest, addCurrency } = useInventoryActions();
  const { setSimulationSpeed, setNotificationsEnabled, setSoundEnabled, completeTutorial, markInventoryInitialised } = useSettingsActions();
  const { recordDiscovery } = useAppStore((s) => ({ recordDiscovery: s.recordDiscovery }));

  const lastSimulatedAt     = useAppStore((s) => s.lastSimulatedAt);
  const simulationSpeed     = useAppStore((s) => s.simulationSpeed);
  const inventoryInitialised = useInventoryInitialised();

  useEffect(() => {
    let mounted = true;

    async function initialise() {
      // 0. Init notifications
      await initNotifications();

      // 1. Try to restore saved state
      const savedState = await loadSavedState();

      if (savedState) {
        // Restore garden
        const store = useAppStore.getState();
        // We need to set garden, inventory, settings, and journal state
        // Since Zustand doesn't have a batch setter, we do individual mutations

        // Restore settings first
        setSimulationSpeed(savedState.settings.simulationSpeed);
        setNotificationsEnabled(savedState.settings.notificationsEnabled);
        setSoundEnabled(savedState.settings.soundEnabled);
        if (savedState.settings.tutorialComplete) completeTutorial();
        if (savedState.settings.inventoryInitialised) markInventoryInitialised();

        // Restore garden — rebuild plots and plants via internal state
        // We do this by directly setting the garden slice
        useAppStore.setState({
          plots: savedState.garden.plots,
          plants: savedState.garden.plants,
        });

        // Restore inventory
        useAppStore.setState({
          seeds: savedState.inventory.seeds,
          harvests: savedState.inventory.harvests,
          currency: savedState.inventory.currency,
        });

        // Restore journal
        useAppStore.setState({
          entries: savedState.journal.entries,
          newDiscoveries: savedState.journal.newDiscoveries,
        });
      } else {
        // No saved state — fresh start
        // 2. Initialise garden grid (no-op if already exists)
        initGarden();

        // 3. Seed starting inventory on first ever launch
        if (!inventoryInitialised) {
          initStartingInventory();
          markInventoryInitialised();
        }
      }

      // 4. Offline catch-up simulation with chunking
      // Phase 9: Chunked simulation prevents startup jank
      // Instead of simulating all 720+ ticks at once, process in batches
      const now = Date.now();
      const elapsedMs = now - lastSimulatedAt;
      const elapsedTicks = Math.floor((elapsedMs / 5000) * simulationSpeed);

      if (elapsedTicks > 0) {
        // Process ticks in chunks to yield to main thread
        const CHUNK_SIZE = 100; // Simulate 100 ticks per chunk
        let processedTicks = 0;

        const processChunk = () => {
          const remaining = elapsedTicks - processedTicks;
          const chunkTicks = Math.min(CHUNK_SIZE, remaining);

          if (chunkTicks > 0) {
            tickSimulation(chunkTicks);
            processedTicks += chunkTicks;

            if (processedTicks < elapsedTicks) {
              // Schedule next chunk on next event loop iteration
              setTimeout(processChunk, 10);
            }
          }
        };

        processChunk();
      }

      setLastSimulatedAt(now);

      // 5. Wire autosave (subscribes to store, writes debounced to AsyncStorage)
      if (mounted) {
        subscribeAutosave(useAppStore);
      }
    }

    initialise();

    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ─── Root Layout ──────────────────────────────

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return null;
  }
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.bg_deep} />
        <AppInitialiser />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg_primary },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
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
