import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ToastAndroid,
} from 'react-native';

import { useSession, ThemeOption } from './store/useSession';

const themeOptions: ThemeOption[] = ['light', 'dark', 'system'];

const SettingsScreen: React.FC = () => {
  const {
    name,
    avatarUrl,
    notificationsEnabled,
    setNotifications,
    theme,
    setTheme,
    updateName,
    updateAvatar,
  } = useSession();
  const [nameInput, setNameInput] = useState(name);
  const [avatarInput, setAvatarInput] = useState(avatarUrl ?? '');

  useEffect(() => {
    setNameInput(name);
  }, [name]);

  useEffect(() => {
    setAvatarInput(avatarUrl ?? '');
  }, [avatarUrl]);

  const handleSaveProfile = () => {
    const trimmedName = nameInput.trim();
    const trimmedAvatar = avatarInput.trim();

    if (trimmedName.length > 0) {
      updateName(trimmedName);
    }

    updateAvatar(trimmedAvatar.length > 0 ? trimmedAvatar : undefined);

    const message = 'Profile updated';
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Flick', message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile Settings</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Enter your name"
            style={styles.input}
            placeholderTextColor="#8e8e93"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Avatar URL</Text>
          <TextInput
            value={avatarInput}
            onChangeText={setAvatarInput}
            placeholder="https://..."
            style={styles.input}
            placeholderTextColor="#8e8e93"
            autoCapitalize="none"
          />
        </View>
        <TouchableOpacity style={[styles.primaryButton]} onPress={handleSaveProfile}>
          <Text style={styles.primaryButtonText}>Save profile</Text>
        </TouchableOpacity>
      </View>

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
    width: '100%',
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
  fieldGroup: {
    gap: 8
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1c1c1e'
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
  },
  primaryButton: {
    backgroundColor: '#FF6F3C',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default SettingsScreen;
