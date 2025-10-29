import React, { useMemo } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { api } from './api/client';
import { DrillsStackParamList } from './navigation/types';
import { AppTheme, AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

const createStyles = (colors: AppThemeColors, spacing: AppTheme['spacing'], typography: AppTheme['typography']) =>
  StyleSheet.create({
    listContent: {
      paddingBottom: spacing.section * 6,
    },
    loader: {
      marginTop: spacing.screenVertical * 1.5,
    },
    sectionHeader: {
      fontSize: typography.subtitle,
      fontWeight: '700',
      marginBottom: spacing.itemGap,
      marginTop: spacing.section,
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: spacing.cardRadius,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.itemGap,
      marginBottom: spacing.itemGap,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    title: {
      fontSize: typography.subtitle,
      fontWeight: '600',
      color: colors.text,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.itemGap,
      flexWrap: 'wrap',
    },
    metaText: {
      color: colors.muted,
      fontSize: typography.small,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 999,
    },
    badgeText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: typography.caption,
    },
    ctaButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: spacing.cardRadius,
    },
    ctaText: {
      color: '#fff',
      fontWeight: '700',
    },
  });

const getDifficultyColor = (difficulty: string, colors: AppThemeColors) => {
  switch (difficulty) {
    case 'Beginner':
      return colors.success;
    case 'Intermediate':
      return colors.warning;
    case 'Advanced':
      return colors.danger;
    default:
      return colors.accent;
  }
};

const DrillsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<DrillsStackParamList>>();
  const { colors, sharedStyles, spacing, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, spacing, typography), [colors, spacing, typography]);

  const { data, isLoading } = useQuery({
    queryKey: ['drills'],
    queryFn: api.getDrills,
  });

  const sections = useMemo(() => {
    if (!data) return [];
    const grouped = data.reduce<Record<string, typeof data>>((acc, drill) => {
      acc[drill.category] = acc[drill.category] ? [...acc[drill.category], drill] : [drill];
      return acc;
    }, {});
    return Object.entries(grouped).map(([category, drills]) => ({
      title: category,
      data: drills,
    }));
  }, [data]);

  return (
    <View style={sharedStyles.screen}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.accent} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1, gap: spacing.itemGap * 0.75 }}>
                <Text style={styles.title}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.badge, { backgroundColor: getDifficultyColor(item.difficulty, colors) }]}>
                    <Text style={styles.badgeText}>{item.difficulty}</Text>
                  </View>
                  <Text style={styles.metaText}>{item.minutes} min</Text>
                  <Text style={styles.metaText}>{item.focus}</Text>
                </View>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.ctaButton}
                onPress={() => navigation.navigate('DrillDetail', { id: item.id })}
              >
                <Text style={styles.ctaText}>Start</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default DrillsScreen;
