import React, { useEffect, useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from './api/client';
import ProBadge from './components/ProBadge';
import { useSession } from './store/useSession';
import { RootTabParamList } from './navigation/types';
import { AppTheme, AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

const createStyles = (colors: AppThemeColors, spacing: AppTheme['spacing'], typography: AppTheme['typography']) =>
  StyleSheet.create({
    content: {
      paddingBottom: spacing.section * 6,
      gap: spacing.section,
      flexGrow: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.itemGap,
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
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.itemGap / 2,
      marginTop: 6,
    },
    badgeLabel: {
      color: colors.muted,
      fontWeight: '600',
    },
    upgradeCard: {
      backgroundColor: colors.accent,
      padding: spacing.section,
      borderRadius: spacing.cardRadius + 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.itemGap,
    },
    upgradeTitle: {
      color: '#fff',
      fontSize: typography.subtitle,
      fontWeight: '700',
    },
    upgradeBody: {
      color: '#fff',
      opacity: 0.9,
      marginTop: 4,
      fontSize: typography.body,
    },
    tiles: {
      gap: spacing.itemGap,
    },
    tile: {
      backgroundColor: colors.surface,
      borderRadius: spacing.cardRadius,
      padding: spacing.section,
      gap: spacing.itemGap / 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    tileText: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    tileSub: {
      color: colors.muted,
      fontSize: typography.small,
    },
  });

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { colors, sharedStyles, spacing, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, spacing, typography), [colors, spacing, typography]);
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
    <View style={sharedStyles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="person" size={28} color={colors.muted} />
          </View>
        )}
        <View>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.badgeRow}>
            <ProBadge active={isPro} />
            <Text style={styles.badgeLabel}>{isPro ? 'PRO Member' : 'Free tier'}</Text>
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
          <Ionicons name="trophy" size={22} color={colors.accent} />
          <Text style={styles.tileText}>P4P Badge</Text>
          <Text style={styles.tileSub}>Shooter Level 1</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile}>
          <Ionicons name="card" size={22} color={colors.accent} />
          <Text style={styles.tileText}>Billing</Text>
          <Text style={styles.tileSub}>Manage payment (coming soon)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings" size={22} color={colors.accent} />
          <Text style={styles.tileText}>Settings</Text>
          <Text style={styles.tileSub}>Notifications, theme</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tile}>
          <Ionicons name="log-out" size={22} color={colors.accent} />
          <Text style={styles.tileText}>Log out</Text>
          <Text style={styles.tileSub}>Sign out of Flick</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
  );
};

export default ProfileScreen;
