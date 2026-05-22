import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { COLORS, GAME } from './src/constants/theme';
import { useAppStore, useGardenActions, useInventoryActions, useSettingsActions } from './src/store';
import { loadGameState, autoSaveMiddleware } from './src/store/persistence';

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

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const savedState = await loadGameState();
        if (savedState && Object.keys(savedState.garden.plots).length > 0) {
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
        } else {
          console.log('🟢 Inizializzazione forzata: creazione vasi e semi');
          useGardenActions.getState().initGarden();
          const success = useInventoryActions.getState().initStartingInventory();
          if (!success) {
            // Fallback: aggiunge semi base manualmente
            const now = Date.now();
            const fallbackSeeds = [
              { speciesId: 'tomato', genotype: { genes: {} }, phenotype: { rarityScore: 0.2, growthRate: 0.5, fruitSize: 0.5, yieldMultiplier: 1.0 }, rarity: 'common', quantity: 3, parentIds: [null, null], generation: 0, isHybrid: false, obtainedAt: now },
              { speciesId: 'basil', genotype: { genes: {} }, phenotype: { rarityScore: 0.2, growthRate: 0.5, fruitSize: 0.5, yieldMultiplier: 1.0 }, rarity: 'common', quantity: 2, parentIds: [null, null], generation: 0, isHybrid: false, obtainedAt: now },
            ];
            fallbackSeeds.forEach(seedData => {
              const id = `seed_${seedData.speciesId}_${Date.now()}_${Math.random()}`;
              useAppStore.setState(state => ({ seeds: { ...state.seeds, [id]: { ...seedData, id } } }));
            });
          }
          useSettingsActions.getState().markInventoryInitialised();
        }
        autoSaveMiddleware({ getState: () => useAppStore.getState(), setState: () => {}, subscribe: useAppStore.subscribe });
      } catch (error) {
        console.warn('Bootstrap error, forcing fresh state:', error);
        useGardenActions.getState().initGarden();
        useSettingsActions.getState().markInventoryInitialised();
      }
      setReady(true);
    }
    bootstrap();
  }, []);

  if (!ready) return <LoadingScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg_deep }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.bg_deep} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}