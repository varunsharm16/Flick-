import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import RecordScreen from './app/screens/RecordScreen';
import ProgressScreen from './app/screens/ProgressScreen';
import DrillsScreen from './app/screens/DrillsScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import DrillDetailScreen from './app/screens/DrillDetailScreen';

export type RootStackParamList = {
  Tabs: undefined;
  Settings: undefined;
  DrillDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const queryClient = new QueryClient();

const tabBarIcon = (name: string, focused: boolean) => (
  <Ionicons name={name as any} size={24} color={focused ? '#FF6F3C' : '#888'} />
);

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#ffffff'
  }
};

function TabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF6F3C',
        tabBarStyle: {
          paddingBottom: 6,
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 12
        }
      }}
    >
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarIcon: ({ focused }) => tabBarIcon('camera', focused)
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ focused }) => tabBarIcon('stats-chart', focused)
        }}
      />
      <Tab.Screen
        name="Drills"
        component={DrillsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name="basketball"
              size={24}
              color={focused ? '#FF6F3C' : '#888'}
            />
          )
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => tabBarIcon('person-circle', focused)
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="dark" />
            <Stack.Navigator>
              <Stack.Screen
                name="Tabs"
                component={TabsNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Settings' }}
              />
              <Stack.Screen
                name="DrillDetail"
                component={DrillDetailScreen}
                options={{ title: 'Drill Details' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
