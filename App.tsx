// App.tsx - VERSIONE MINIMALE PER TEST
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();

// Screen minimale per test
function GardenScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg_primary }}>
      <Text style={{ color: COLORS.green_bright, fontSize: 20 }}>✅ Garden</Text>
    </View>
  );
}

function InventoryScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg_primary }}>
      <Text style={{ color: COLORS.green_bright, fontSize: 20 }}>✅ Seeds</Text>
    </View>
  );
}

function LabScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg_primary }}>
      <Text style={{ color: COLORS.green_bright, fontSize: 20 }}>✅ Lab</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg_primary }}>
      <Text style={{ color: COLORS.green_bright, fontSize: 20 }}>✅ Settings</Text>
    </View>
  );
}

// Loading Screen
function LoadingScreen() {
  return (
    <View style={loadingStyles.root}>
      <Text style={loadingStyles.icon}>🌱</Text>
      <Text style={loadingStyles.title}>Plant Genetics</Text>
      <ActivityIndicator size="small" color={COLORS.green_bright} />
      <Text style={loadingStyles.sub}>Loading...</Text>
    </View>
  );
}

const loadingStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg_deep, alignItems: 'center', justifyContent: 'center', gap: 16 },
  icon: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text_accent, letterSpacing: 2 },
  sub: { fontSize: 12, color: COLORS.text_muted },
});

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Garden: focused ? 'leaf' : 'leaf-outline',
    Seeds: focused ? 'archive' : 'archive-outline',
    Lab: focused ? 'flask' : 'flask-outline',
    Settings: focused ? 'settings' : 'settings-outline',
  };
  return <Ionicons name={icons[name] as any} size={22} color={color} />;
}

export default function App() {
  const [ready, setReady] = useState(true); // ← sempre ready

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.bg_deep }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.bg_deep} />
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
