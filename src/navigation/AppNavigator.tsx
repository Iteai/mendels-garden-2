import React, { useEffect, useRef, useCallback } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Leaf, Archive, FlaskConical, Settings } from 'lucide-react-native';
import { useHarvestReadyPlants, useGardenActions, useAppStore } from '../store';
import { COLORS, GAME } from '../constants/theme';
import type { SimulationEvent } from '../simulation';

import GardenScreen from '../../app/(tabs)/garden';
import InventoryScreen from '../../app/(tabs)/inventory';
import LabScreen from '../../app/(tabs)/lab';
import SettingsScreen from '../../app/(tabs)/settings';

const Tab = createBottomTabNavigator();

function HarvestBadge() {
  const readyPlants = useHarvestReadyPlants();
  if (readyPlants.length === 0) return null;
  return (
    <View style={{
      position: 'absolute',
      top: -4,
      right: -8,
      width: 10,
      height: 10,
      borderRadius: 10,
      backgroundColor: COLORS.text_accent,
    }} />
  );
}

function GardenIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ position: 'relative' }}>
      <Leaf color={color} size={size} />
      <HarvestBadge />
    </View>
  );
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

export function AppNavigator() {
  return (
    <>
      <SimulationLoop />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.bg_deep,
              borderTopColor: COLORS.border_normal,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: COLORS.green_bright,
            tabBarInactiveTintColor: COLORS.text_muted,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
          }}
        >
          <Tab.Screen name="Garden" component={GardenScreen} options={{ tabBarIcon: (props) => <GardenIcon color={props.color} size={props.size} /> }} />
          <Tab.Screen name="Seeds" component={InventoryScreen} options={{ tabBarIcon: ({ color, size }) => <Archive color={color} size={size} /> }} />
          <Tab.Screen name="Lab" component={LabScreen} options={{ tabBarIcon: ({ color, size }) => <FlaskConical color={color} size={size} /> }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
