import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../lib/supabase';
import { api } from '../../api/client';
import { useSession } from '../../store/useSession';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name, avatarUrl, updateAvatar, updateName } = useSession();
  const [displayName, setDisplayName] = useState(name);

  useEffect(() => {
    setDisplayName(name);
  }, [name]);

  const { data: progress } = useQuery({
    queryKey: ['profile-progress'],
    queryFn: () => api.getProgress('14d'),
  });

  const sessions = progress?.accuracyTrend?.length ?? 0;
  const improvement = Math.round((progress?.deltaAccuracy ?? 0) * 100);
  const consistency = Math.round((progress?.formConsistency ?? 0) * 100);

  const updateNameMutation = useMutation({
    mutationFn: async (next: string) => {
      updateName(next);
      return next;
    },
    onSuccess: (next) => {
      setDisplayName(next);
    },
  });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need access to your camera roll to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (result.canceled || !result.assets?.length) return;

    const uri = result.assets[0]?.uri;
    if (uri) {
      updateAvatar(uri);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/Auth');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      >
        <LinearGradient colors={['#0f172a', '#020617']} style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={['#FF5F6D', '#FF3B30']} style={styles.avatarFallback}>
                <Text style={styles.avatarInitial}>{name.slice(0, 1).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <Pressable
              style={({ pressed }) => [styles.photoButton, pressed && styles.photoButtonPressed]}
              onPress={pickImage}
            >
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.photoLabel}>Change photo</Text>
            </Pressable>
          </View>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileTag}>Locked in & leveling up</Text>
        </LinearGradient>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{sessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{improvement >= 0 ? `+${improvement}%` : `${improvement}%`}</Text>
              <Text style={styles.statLabel}>Accuracy change</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{consistency}%</Text>
              <Text style={styles.statLabel}>Consistency</Text>
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Display name</Text>
            <View style={styles.inputRow}>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.textInput}
                placeholder="Your display name"
                placeholderTextColor="rgba(148, 163, 184, 0.8)"
              />
              <Pressable
                style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
                onPress={() => {
                  const trimmed = displayName.trim();
                  updateNameMutation.mutate(trimmed || name);
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={styles.logoutLabel}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#010617',
  },
  content: {
    gap: 28,
  },
  profileHeader: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  avatarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#FF3B30',
  },
  photoButtonPressed: {
    opacity: 0.85,
  },
  photoLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  profileName: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileTag: {
    color: 'rgba(226, 232, 240, 0.8)',
    fontSize: 14,
  },
  statsSection: {
    paddingHorizontal: 24,
    gap: 16,
  },
  sectionTitle: {
    color: 'rgba(226, 232, 240, 0.9)',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  statValue: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  settingsSection: {
    paddingHorizontal: 24,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: '#022c22',
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  logoutLabel: {
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 16,
  },
});
