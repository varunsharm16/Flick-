import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import DrillsScreen from './drills';
import DrillDetailScreen from './drill-detail';
import RecordScreen from './record';
import ProgressScreen from './progress';
import ProfileScreen from './profile';
import SettingsScreen from './settings';
import { useAppTheme } from '@/hooks/useAppTheme';
import { DrillsStackParamList, RootTabParamList } from './navigation/types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const DrillsStack = createNativeStackNavigator<DrillsStackParamList>();

const DrillsNavigator = () => {
  const { colors } = useAppTheme();

  return (
    <DrillsStack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <DrillsStack.Screen name="Drills" component={DrillsScreen} options={{ headerShown: false }} />
      <DrillsStack.Screen name="DrillDetail" component={DrillDetailScreen} options={{ title: 'Drill detail' }} />
    </DrillsStack.Navigator>
  );
};

const AppTabs = () => {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: colors.background }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 68,
          paddingBottom: 12,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, focused, size }) => {
          const iconSize = focused ? size + 2 : size;

          switch (route.name) {
            case 'DrillsStack':
              return <Ionicons name={focused ? 'basketball' : 'basketball-outline'} size={iconSize} color={color} />;
            case 'Record':
              return <Ionicons name={focused ? 'videocam' : 'videocam-outline'} size={iconSize} color={color} />;
            case 'Progress':
              return <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={iconSize} color={color} />;
            case 'Profile':
              return <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={iconSize} color={color} />;
            case 'Settings':
              return <Ionicons name={focused ? 'settings' : 'settings-outline'} size={iconSize} color={color} />;
            default:
              return null;
          }
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="DrillsStack" component={DrillsNavigator} options={{ title: 'Drills' }} />
      <Tab.Screen name="Record" component={RecordScreen} options={{ title: 'Record' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
};

export default function Layout() {
  const { colors, colorScheme } = useAppTheme();
  const [queryClient] = useState(() => new QueryClient());
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const navigationTheme = useMemo(
    () => ({
      dark: colorScheme === 'dark',
      colors: {
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    }),
    [colorScheme, colors],
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {isBooting ? (
            <View style={[styles.splash, { backgroundColor: colors.background }]}> 
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.splashText, { color: colors.text }]}>Warming up the court...</Text>
            </View>
          ) : (
            <NavigationContainer theme={navigationTheme}>
              <AppTabs />
            </NavigationContainer>
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  splashText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
