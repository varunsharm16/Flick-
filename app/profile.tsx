import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { api } from './api/client';
import ProBadge from './components/ProBadge';
import SettingsScreen from './settings';
import { useSession } from './store/useSession';

const ProfileScreen: React.FC = () => {
  const { name, avatarUrl, isPro, setProfile, updateName, updateAvatar, upgradeToPro } = useSession();
  const insets = useSafeAreaInsets();
  const [nameInput, setNameInput] = useState(name);

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
  });

  useEffect(() => {
    if (data) {
      setProfile({
        name: data.name,
        avatarUrl: data.avatarUrl,
        isPro: data.isPro,
      });
    }
  }, [data, setProfile]);

  useEffect(() => {
    setNameInput(name);
  }, [name]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Enable Photos access to change your avatar.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      updateAvatar(res.assets[0].uri);
      // if backend upload exists: await api.uploadAvatar(res.assets[0].uri)
    }
  };

  const handleSaveProfile = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Add a display name to save your profile.');
      return;
    }

    updateName(trimmed);
    Alert.alert('Profile updated', 'Your display name was saved.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="person" size={36} color="#6c6c70" />
              </View>
            )}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={pickImage}
              style={styles.changePhotoButton}
            >
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.badgeRow}>
              <ProBadge active={isPro} />
              <Text style={styles.badgeLabel}>{isPro ? 'PRO Member' : 'Free tier'}</Text>
            </View>
            <View style={styles.badgesList}>
              <View style={styles.badgeCard}>
                <Ionicons name="trophy" size={18} color="#FF6F3C" />
                <View>
                  <Text style={styles.badgeTitle}>P4P Badge</Text>
                  <Text style={styles.badgeDescription}>Shooter Level 1</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Display name</Text>
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Enter your name"
              placeholderTextColor="#8e8e93"
              style={styles.input}
              autoCapitalize="words"
              accessibilityLabel="Display name"
            />
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProfile}>
            <Text style={styles.primaryButtonText}>Save profile</Text>
          </TouchableOpacity>
        </View>

        {!isPro && (
          <TouchableOpacity style={styles.upgradeCard} onPress={upgradeToPro}>
            <View>
              <Text style={styles.upgradeTitle}>Go PRO for deeper insights</Text>
              <Text style={styles.upgradeBody}>Unlock advanced analytics and AI-driven drills.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.tiles}>
          <TouchableOpacity style={styles.tile}>
            <Ionicons name="card" size={22} color="#FF6F3C" />
            <Text style={styles.tileText}>Billing</Text>
            <Text style={styles.tileSub}>Manage payment (coming soon)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tile}>
            <Ionicons name="log-out" size={22} color="#FF6F3C" />
            <Text style={styles.tileText}>Log out</Text>
            <Text style={styles.tileSub}>Sign out of Flick</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <SettingsScreen />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    padding: 20,
    backgroundColor: '#F2F2F7',
    gap: 20,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d6',
  },
  changePhotoText: {
    fontWeight: '600',
    color: '#FF6F3C',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  badgeLabel: {
    color: '#6c6c70',
    fontWeight: '600',
  },
  badgesList: {
    marginTop: 8,
    gap: 8,
    alignSelf: 'stretch',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    shadowColor: '#00000010',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    alignSelf: 'stretch',
  },
  badgeTitle: {
    fontWeight: '600',
    color: '#1c1c1e',
  },
  badgeDescription: {
    color: '#6c6c70',
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#00000010',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1c1c1e',
  },
  primaryButton: {
    backgroundColor: '#FF6F3C',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeCard: {
    backgroundColor: '#FF6F3C',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upgradeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  upgradeBody: {
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  tiles: {
    gap: 12,
  },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  tileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  tileSub: {
    color: '#6c6c70',
  },
  section: {
    gap: 16,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
});

export default ProfileScreen;
