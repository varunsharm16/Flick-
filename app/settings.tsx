import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ThemeOption, useSession } from './store/useSession';

const themeOptions: ThemeOption[] = ['light', 'dark', 'system'];

const SettingsScreen: React.FC = () => {
  const { theme, setTheme } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Check actual permission status on mount and when app returns to foreground
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
      setPermissionDenied(status === 'denied');
    };

    checkPermissions();

    // Re-check when app returns from settings
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      checkPermissions();
    });

    return () => subscription.remove();
  }, []);

  const handleToggle = useCallback(async (value: boolean) => {
    if (value) {
      // User wants to enable notifications
      const { status } = await Notifications.getPermissionsAsync();

      if (status === 'denied') {
        // Already denied - need to go to system settings
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      if (status !== 'granted') {
        // Request permission
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        setNotificationsEnabled(newStatus === 'granted');
        setPermissionDenied(newStatus === 'denied');
      } else {
        setNotificationsEnabled(true);
      }
    } else {
      // User wants to disable - inform them to use system settings
      Alert.alert(
        'Disable Notifications',
        'To disable notifications, please use your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Push alerts</Text>
            {permissionDenied && (
              <Text style={styles.helperText}>Disabled in device settings</Text>
            )}
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggle}
            thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
            trackColor={{ true: '#FF6F3C', false: '#c7c7cc' }}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Theme</Text>
        {themeOptions.map(option => (
          <Pressable key={option} style={styles.row} onPress={() => setTheme(option)}>
            <Text style={styles.label}>{option.toUpperCase()}</Text>
            <View style={[styles.radio, theme === option && styles.radioActive]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#00000010',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  helperText: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d1d6',
  },
  radioActive: {
    borderColor: '#FF6F3C',
    backgroundColor: '#FF6F3C33',
  },
});

export default SettingsScreen;

