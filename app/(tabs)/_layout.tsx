import React, { useEffect, useRef, useCallback } from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useGardenActions, useAppStore } from '../../src/store';
import { GAME } from '../../src/constants/theme';
import { getVariety } from '../../src/genetics/varieties';
import { getSpecies } from '../../src/genetics/species';
import {
  scheduleHarvestReadyNotification,
  scheduleWaterCriticalNotification,
  schedulePlantDiedNotification,
} from '../../src/simulation/notifications';
import type { SimulationEvent } from '../../src/simulation';

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

function SimulationLoop() {
  const { tickSimulation, setLastSimulatedAt } = useGardenActions();
  const simulationSpeed = useAppStore((s) => s.simulationSpeed);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(simulationSpeed);
  const notifRef = useRef(notificationsEnabled);

  useEffect(() => {
    speedRef.current = simulationSpeed;
  }, [simulationSpeed]);

  useEffect(() => {
    notifRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  const runTick = useCallback(() => {
    const events: SimulationEvent[] = tickSimulation(speedRef.current);
    setLastSimulatedAt(Date.now());

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

export default function TabLayout() {
  return (
    <>
      <SimulationLoop />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#C4D97A',
          tabBarInactiveTintColor: '#7A846E',
          tabBarStyle: {
            backgroundColor: '#0B1408',
            borderTopColor: '#26311F',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="garden"
          options={{
            title: 'Garden',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="leaf-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Seeds',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="archive-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="lab"
          options={{
            title: 'Lab',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="flask-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
