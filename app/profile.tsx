import React, { useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { api } from './api/client';
import ProBadge from './components/ProBadge';
import SettingsScreen from './settings';
import { useSession } from './store/useSession';

const ProfileScreen: React.FC = () => {
  const { name, avatarUrl, isPro, setProfile, upgradeToPro } = useSession();

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: api.getProfile,
  });


  useEffect(() => {
    if (data) {
      setProfile(data);
    }
  }, [data, setProfile]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="person" size={28} color="#6c6c70" />
          </View>
        )}
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
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: '#F2F2F7',
    gap: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  headerText: {
    flex: 1,
    gap: 8
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40
  },
  placeholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e5e5ea',
    alignItems: 'center',
    justifyContent: 'center'
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1c1e'
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6
  },
  badgeLabel: {
    color: '#6c6c70',
    fontWeight: '600'
  },
  badgesList: {
    marginTop: 8,
    gap: 8,
    alignSelf: 'stretch'
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
    alignSelf: 'stretch'
  },
  badgeTitle: {
    fontWeight: '600',
    color: '#1c1c1e'
  },
  badgeDescription: {
    color: '#6c6c70',
    fontSize: 13
  },
  upgradeCard: {
    backgroundColor: '#FF6F3C',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  upgradeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  upgradeBody: {
    color: '#fff',
    opacity: 0.9,
    marginTop: 4
  },
  tiles: {
    gap: 12
  },
  tile: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    gap: 6
  },
  tileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e'
  },
  tileSub: {
    color: '#6c6c70'
  },
  section: {
    gap: 16,
    width: '100%'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e'
  }
});

export default ProfileScreen;
