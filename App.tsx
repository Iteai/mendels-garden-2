// App.tsx - Versione definitiva
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import dei tuoi screen
import GardenScreen from './app/(tabs)/garden';
import InventoryScreen from './app/(tabs)/inventory';
import LabScreen from './app/(tabs)/lab';
import SettingsScreen from './app/(tabs)/settings';

// Import store e persistence
import { useAppStore, useGardenActions, useInventoryActions, useSettingsActions, useInventoryInitialised } from './src/store';
import { loadGameState, autoSaveMiddleware } from './src/store/persistence';
import { COLORS, GAME } from './src/constants/theme';

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
  root: { flex: 1, backgroundColor: COLORS.bg_deep, alignItems: 'center', justifyContent: 'center', gap: 16 },
  icon: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text_accent, letterSpacing: 2 },
  sub: { fontSize: 12, color: COLORS.text_muted },
});

// ─── App Initialiser ─────────────────────────
function AppInitialiser() {
  const { initGarden, tickSimulation, setLastSimulatedAt } = useGardenActions();
  const { initStartingInventory } = useInventoryActions();
  const { markInventoryInitialised } = useSettingsActions();
  const lastSimulatedAt = useAppStore((s) => s.lastSimulatedAt);
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);
  const inventoryInitialised = useInventoryInitialised();

  useEffect(() => {
    async function init() {
      initGarden();
      if (!inventoryInitialised) {
        initStartingInventory();
        markInventoryInitialised();
      }
      const now = Date.now();
      const elapsedMs = now - lastSimulatedAt;
      const elapsedTicks = Math.floor((elapsedMs / 5000) * simulationSpeed);
      if (elapsedTicks > 0) {
        tickSimulation(elapsedTicks);
      }
      setLastSimulatedAt(now);
    }
    init();
  }, []);
  
  return null;
}

// ─── Tab Bar Icon ────────────────────────────
function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Garden: focused ? 'leaf' : 'leaf-outline',
    Seeds: focused ? 'archive' : 'archive-outline',
    Lab: focused ? 'flask' : 'flask-outline',
    Settings: focused ? 'settings' : 'settings-outline',
  };
  return <Ionicons name={icons[name] as any} size={22} color={color} />;
}

// ─── Main App ────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const savedState = await loadGameState();
        if (savedState) {
          useAppStore.setState({
            plots: savedState.garden.plots,
            plants: savedState.garden.plants,
            lastSimulatedAt: savedState.garden.lastSimulatedAt,
            seeds: savedState.inventory.seeds,
            harvests: savedState.inventory.harvests,
            currency: savedState.inventory.currency,
            simulationSpeed: savedState.settings.simulationSpeed,
            notificationsEnabled: savedState.settings.notificationsEnabled,
            soundEnabled: savedState.settings.soundEnabled,
            tutorialComplete: savedState.settings.tutorialComplete,
            inventoryInitialised: savedState.settings.inventoryInitialised,
          });
        }
        autoSaveMiddleware({
          getState: () => useAppStore.getState() as any,
          setState: () => {},
          subscribe: useAppStore.subscribe,
        });
      } catch (e) {
        console.warn('Bootstrap error:', e);
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
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ color, focused }) => <TabIcon name={route.name} color={color} focused={focused} />,
              tabBarActiveTintColor: COLORS.green_bright,
              tabBarInactiveTintColor: COLORS.text_muted,
              tabBarStyle: {
                backgroundColor: COLORS.bg_deep,
                borderTopColor: COLORS.border_normal,
                borderTopWidth: 1,
                paddingBottom: 8,
                paddingTop: 8,
                height: 60,
              },
              tabBarLabelStyle: {
                fontSize: 10,
                letterSpacing: 0.8,
              },
            })}
          >
            <Tab.Screen name="Garden" component={GardenScreen} />
            <Tab.Screen name="Seeds" component={InventoryScreen} />
            <Tab.Screen name="Lab" component={LabScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
