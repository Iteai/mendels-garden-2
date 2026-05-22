import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

const Tab = createBottomTabNavigator();

function GardenScreen() {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>✅ Garden</Text>
    </View>
  );
}
function SeedsScreen() { return <View style={styles.center}><Text style={styles.text}>✅ Seeds</Text></View>; }
function LabScreen() { return <View style={styles.center}><Text style={styles.text}>✅ Lab</Text></View>; }
function SettingsScreen() { return <View style={styles.center}><Text style={styles.text}>✅ Settings</Text></View>; }

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#141A0E' },
  text: { color: '#7DC42A', fontSize: 24 },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <Tab.Navigator screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Garden" component={GardenScreen} />
            <Tab.Screen name="Seeds" component={SeedsScreen} />
            <Tab.Screen name="Lab" component={LabScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
