// ─────────────────────────────────────────────
// App.tsx — Entry point (NavigationContainer)
// Garden, Seeds, Lab, Settings tabs
// Bootstraps game state and auto-save
// ─────────────────────────────────────────────

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import GardenScreen from './app/(tabs)/garden';
import InventoryScreen from './app/(tabs)/inventory';
import LabScreen from './app/(tabs)/lab';
import SettingsScreen from './app/(tabs)/settings';

import { COLORS, GAME } from './src/constants/theme';
import {
  useAppStore,
  useGardenActions,
  useInventoryActions,
  useSettingsActions,
  useHarvestReadyPlants,
  useInventoryInitialised,
} from './src/store';
import { loadGameState, autoSaveMiddleware } from './src/store/persistence';
import type { SimulationEvent } from './src/simulation';

const Tab = createBottomTabNavigator();

// ─── Loading Screen ──────────────────────────

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
  icon: { fontSize: 48 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text_accent, letterSpacing: 2 },
  sub: { fontSize: 12, color: COLORS.text_muted },
});

// ─── Harvest badge ────────────────────────────

function HarvestBadge() {
  const readyPlants = useHarvestReadyPlants();
  if (readyPlants.length === 0) return null;

  return (
    <View style={{
      position: 'absolute',
      top: -2,
      right: -6,
      width: 7,
      height: 7,
      borderRadius: 99,
      backgroundColor: '#C4D97A',
    }} />
  );
}

// ─── App Initialiser ─────────────────────────
// Phase 8: tries AsyncStorage restore first,
//           falls back to fresh initialisation.
// Phase 9: uses async chunked simulation for large offline catch-ups

function AppInitialiser() {
  const { initGarden, tickSimulation, tickSimulationAsync, setLastSimulatedAt } = useGardenActions();
  const { initStartingInventory } = useInventoryActions();
  const { markInventoryInitialised } = useSettingsActions();

  const lastSimulatedAt      = useAppStore((s) => s.lastSimulatedAt);
  const simulationSpeed      = useAppStore((s) => s.simulationSpeed);
  const inventoryInitialised = useInventoryInitialised();

  useEffect(() => {
    async function init() {
      initGarden();

      if (!inventoryInitialised) {
        initStartingInventory();
        markInventoryInitialised();
      }

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

// ─── Simulation Loop ──────────────────────────

function SimulationLoop() {
  const { tickSimulation, setLastSimulatedAt } = useGardenActions();
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(simulationSpeed);

  useEffect(() => { speedRef.current = simulationSpeed; }, [simulationSpeed]);

  const runTick = useCallback(() => {
    const events: SimulationEvent[] = tickSimulation(speedRef.current);
    setLastSimulatedAt(Date.now());
    if (__DEV__ && events.length > 0) console.log(`[Sim] ${events.length} events`);
  }, [tickSimulation, setLastSimulatedAt]);

  useEffect(() => {
    intervalRef.current = setInterval(runTick, GAME.SIMULATION_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [runTick]);

  return null;
}

// ─── Tab icons ────────────────────────────────

function TabIcon({ routeName, focused, color }: {
  routeName: string; focused: boolean; color: string;
}) {
  const icons: Record<string, { focused: string; unfocused: string }> = {
    garden:    { focused: 'leaf',       unfocused: 'leaf-outline' },
    inventory: { focused: 'archive',    unfocused: 'archive-outline' },
    lab:       { focused: 'flask',      unfocused: 'flask-outline' },
    settings:  { focused: 'settings',   unfocused: 'settings-outline' },
  };

  const config = icons[routeName] ?? { focused: 'ellipse', unfocused: 'ellipse-outline' };

  return (
    <View style={{ position: 'relative' }}>
      <Ionicons
        name={focused ? (config.focused as any) : (config.unfocused as any)}
        size={22}
        color={color}
      />
      {routeName === 'garden' && <HarvestBadge />}
    </View>
  );
}

// ─── Main App ─────────────────────────────────

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const savedState = await loadGameState();

        if (savedState) {
          useAppStore.setState({
            plots:       savedState.garden.plots,
            plants:      savedState.garden.plants,
            lastSimulatedAt: savedState.garden.lastSimulatedAt,
            seeds:       savedState.inventory.seeds,
            harvests:    savedState.inventory.harvests,
            currency:    savedState.inventory.currency,
            simulationSpeed:      savedState.settings.simulationSpeed,
            notificationsEnabled: savedState.settings.notificationsEnabled,
            soundEnabled:         savedState.settings.soundEnabled,
            tutorialComplete:     savedState.settings.tutorialComplete,
            inventoryInitialised: savedState.settings.inventoryInitialised,
          });
        }

        autoSaveMiddleware({
          getState: () => useAppStore.getState() as any,
          setState: () => {},
          subscribe: useAppStore.subscribe,
        });
      } catch {
        // proceed with fresh state
      }

      setReady(true);
    }

    bootstrap();
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg_deep }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.bg_deep} />
        <AppInitialiser />
        <SimulationLoop />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused, color }) => (
                <TabIcon routeName={route.name} focused={focused} color={color} />
              ),
              tabBarActiveTintColor: COLORS.green_bright,
              tabBarInactiveTintColor: COLORS.text_muted,
              tabBarStyle: {
                backgroundColor: COLORS.bg_deep,
                borderTopColor: COLORS.border_normal,
                borderTopWidth: 1,
                height: 60,
                paddingBottom: 8,
                paddingTop: 8,
              },
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '600',
                marginTop: 2,
              },
            })}
          >
            <Tab.Screen name="garden" component={GardenScreen} options={{ title: 'Garden' }} />
            <Tab.Screen name="inventory" component={InventoryScreen} options={{ title: 'Seeds' }} />
            <Tab.Screen name="lab" component={LabScreen} options={{ title: 'Lab' }} />
            <Tab.Screen name="settings" component={SettingsScreen} options={{ title: 'Settings' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}