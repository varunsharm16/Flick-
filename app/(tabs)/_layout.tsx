import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: '#8A8A8E',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: Platform.select({ ios: 0, default: 4 }),
        },
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: 'rgba(255,255,255,0.08)',
          paddingTop: 6,
          paddingBottom: Platform.select({ ios: 18, android: 10, default: 12 }),
          height: Platform.select({ ios: 84, android: 72, default: 72 }),
        },
        tabBarIcon: ({ color, focused, size }) => {
          const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            record: focused ? 'radio-button-on' : 'radio-button-off',
            progress: focused ? 'stats-chart' : 'stats-chart-outline',
            'ai-coach': focused ? 'sparkles' : 'sparkles-outline',
            profile: focused ? 'person-circle' : 'person-circle-outline',
          };

          const iconName = iconMap[route.name] ?? 'ellipse-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="record"
        options={{ title: 'Record' }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: 'Progress' }}
      />
      <Tabs.Screen
        name="ai-coach"
        options={{ title: 'AI Coach' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
    </Tabs>
  );
}
