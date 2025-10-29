import React from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSession, ThemeOption } from './store/useSession';

const themeOptions: ThemeOption[] = ['light', 'dark', 'system'];

const SettingsScreen: React.FC = () => {
  const { notificationsEnabled, setNotifications, theme, setTheme } = useSession();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Push alerts</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotifications}
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
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 20,
    gap: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#00000010',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 16,
    color: '#1c1c1e'
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d1d6'
  },
  radioActive: {
    borderColor: '#FF6F3C',
    backgroundColor: '#FF6F3C33'
  }
});

export default SettingsScreen;
