// ─────────────────────────────────────────────
// app/_layout.tsx
// Root layout — Expo Router entry point
// Phase 8: Load saved state + Toast + Autosave
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { COLORS } from '../src/constants/theme';
import { ToastContainer } from '../src/components/feedback/Toast';
import {
  useAppStore,
  useGardenActions,
  useInventoryActions,
  useSettingsActions,
  useInventoryInitialised,
} from '../src/store';
import { loadGame, startAutosave, stopAutosave, saveGame } from '../src/store/persistenceStore';
import { showInfo } from '../src/components/feedback/useToastStore';

// ─── App Initialiser ─────────────────────────

function AppInitialiser() {
  const { initGarden, tickSimulation, setLastSimulatedAt } = useGardenActions();
  const { initStartingInventory } = useInventoryActions();
  const { markInventoryInitialised } = useSettingsActions();

  const lastSimulatedAt     = useAppStore((s) => s.lastSimulatedAt);
  const simulationSpeed     = useAppStore((s) => s.simulationSpeed);
  const inventoryInitialised = useInventoryInitialised();

  useEffect(() => {
    (async () => {
      // 1. Try to restore saved state
      const savedState = await loadGame();
      if (savedState) {
        // Apply saved state to store (partial update)
        useAppStore.setState(savedState);
        showInfo('Game restored from save');
      }

      // 2. Initialise garden grid (no-op if already exists from save)
      initGarden();

      // 3. Seed starting inventory on first ever launch
      if (!inventoryInitialised && !savedState) {
        initStartingInventory();
        markInventoryInitialised();
      }

      // 4. Offline catch-up simulation
      const now = Date.now();
      const savedLastAt = savedState?.lastSimulatedAt ?? lastSimulatedAt;
      const elapsedMs = now - savedLastAt;
      const elapsedTicks = Math.floor((elapsedMs / 5000) * simulationSpeed);
      if (elapsedTicks > 0) {
        tickSimulation(elapsedTicks);
      }
      setLastSimulatedAt(now);

      // 5. Start autosave
      startAutosave(() => useAppStore.getState());
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ─── Background Save Listener ─────────────────

function BackgroundSaveHandler() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // Save whenever the app goes to background or becomes inactive
      if (appState.current.match(/active|inactive/) && nextAppState === 'background') {
        saveGame(() => useAppStore.getState());
      }
      appState.current = nextAppState;
    });

    return () => {
      // Save on unmount (app closing)
      saveGame(() => useAppStore.getState());
      stopAutosave();
      subscription.remove();
    };
  }, []);

  return null;
}

// ─── Root Layout ──────────────────────────────

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.bg_deep} />
        <AppInitialiser />
        <BackgroundSaveHandler />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg_primary },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        {/* Toast overlay — renders above everything */}
        <ToastContainer />
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