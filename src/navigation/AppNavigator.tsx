import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Leaf, Archive, FlaskConical, Settings } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import GardenScreen from '../../app/(tabs)/garden';
import InventoryScreen from '../../app/(tabs)/inventory';
import LabScreen from '../../app/(tabs)/lab';
import SettingsScreen from '../../app/(tabs)/settings';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
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
        <Tab.Screen name="Garden" component={GardenScreen} options={{ tabBarIcon: ({ color, size }) => <Leaf color={color} size={size} /> }} />
        <Tab.Screen name="Seeds" component={InventoryScreen} options={{ tabBarIcon: ({ color, size }) => <Archive color={color} size={size} /> }} />
        <Tab.Screen name="Lab" component={LabScreen} options={{ tabBarIcon: ({ color, size }) => <FlaskConical color={color} size={size} /> }} />
        <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};
