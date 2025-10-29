import React from 'react';
import { useColorScheme } from 'react-native';
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
const Stack = createNativeStackNavigator();

function DrillsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Drills"
        component={DrillsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DrillDetail"
        component={DrillDetailScreen}
        options={{
          title: 'Drill Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
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

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <MainTabs />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
