import React, { useEffect, useState } from 'react';
import { useColorScheme, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import DrillsScreen from './drills';
import DrillDetailScreen from './drill-detail';
import RecordScreen from './record';
import ProgressScreen from './progress';
import ProfileScreen from './profile';
import SettingsScreen from './settings';

const queryClient = new QueryClient();

const Tab = createBottomTabNavigator();
const DrillsStackNavigator = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function DrillsStack() {
  return (
    <DrillsStackNavigator.Navigator>
      <DrillsStackNavigator.Screen
        name="Drills"
        component={DrillsScreen}
        options={{ headerShown: false }}
      />
      <DrillsStackNavigator.Screen
        name="DrillDetail"
        component={DrillDetailScreen}
        options={{
          title: 'Drill Details',
          headerBackTitle: 'Back',
        }}
      />
    </DrillsStackNavigator.Navigator>
  );
}

function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <Text style={styles.splashText}>Flick</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            Drills: 'barbell-outline',
            Record: 'videocam-outline',
            Progress: 'stats-chart-outline',
            Profile: 'person-circle-outline',
            Settings: 'settings-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6F3C',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Drills" component={DrillsStack} />
      <Tab.Screen name="Record" component={RecordScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function Layout() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setShowSplash(false), 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <RootStack.Navigator screenOptions={{ headerShown: false }}>
            {showSplash ? (
              <RootStack.Screen name="Splash" component={SplashScreen} />
            ) : (
              <RootStack.Screen name="Main" component={MainTabs} />
            )}
          </RootStack.Navigator>
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0D17',
  },
  splashText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FF6F3C',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
