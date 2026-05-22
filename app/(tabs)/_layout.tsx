import React, { useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGardenActions, useAppStore, useHarvestReadyPlants } from '../../src/store';
import { GAME, COLORS } from '../../src/constants/theme';
import type { SimulationEvent } from '../../src/simulation';

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

// ─── Harvest badge ────────────────────────────
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
  container: { position: 'absolute', top: -2, right: -2, zIndex: 10 },
  dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#C4D97A' },
});

// ─── Tab Layout con TouchableOpacity ──────────
export default function TabLayout() {
  return (
    <>
      <SimulationLoop />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              activeOpacity={0.7}
              onPress={(e) => {
                props.onPress?.(e);
              }}
              style={[props.style, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
            />
          ),
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
        <Tabs.Screen
          name="garden"
          options={{
            title: 'Garden',
            tabBarIcon: ({ focused, color }) => (
              <View style={{ position: 'relative' }}>
                <Ionicons name={focused ? 'leaf' : 'leaf-outline'} size={22} color={color} />
                <HarvestBadge />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Seeds',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'archive' : 'archive-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="lab"
          options={{
            title: 'Lab',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'flask' : 'flask-outline'} size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}