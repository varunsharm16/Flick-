import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from './api/client';
import { DrillsStackParamList } from './navigation/types';
import { AppTheme, AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

const createStyles = (colors: AppThemeColors, spacing: AppTheme['spacing'], typography: AppTheme['typography']) =>
  StyleSheet.create({
    container: {
      gap: spacing.section,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.screenHorizontal,
    },
    missing: {
      color: colors.muted,
      fontSize: typography.body,
    },
    title: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.text,
    },
    meta: {
      color: colors.muted,
      fontSize: typography.small,
    },
    videoPlaceholder: {
      height: 200,
      borderRadius: spacing.cardRadius,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    videoText: {
      color: colors.muted,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: typography.subtitle,
      fontWeight: '700',
      color: colors.text,
    },
    stepRow: {
      flexDirection: 'row',
      gap: spacing.itemGap,
      paddingVertical: 10,
      alignItems: 'flex-start',
    },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepIndex: {
      color: '#fff',
      fontWeight: '700',
    },
    stepText: {
      flex: 1,
      fontSize: typography.body,
      color: colors.text,
      lineHeight: 22,
    },
  });

const DrillDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<DrillsStackParamList, 'DrillDetail'>>();
  const { id } = route.params;
  const { colors, sharedStyles, spacing, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, spacing, typography), [colors, spacing, typography]);

  const { data, isLoading } = useQuery({
    queryKey: ['drills'],
    queryFn: api.getDrills,
  });

  const drill = useMemo(() => data?.find((item) => item.id === id), [data, id]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!drill) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Drill not found.</Text>
      </View>
    );
  }

  return (
    <View style={[sharedStyles.screen, styles.container]}>
      <Text style={styles.title}>{drill.name}</Text>
      <Text style={styles.meta}>
        {drill.difficulty} · {drill.minutes} min · Focus: {drill.focus}
      </Text>
      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoText}>Video coming soon</Text>
      </View>
      <Text style={styles.sectionTitle}>Steps</Text>
      <FlatList
        data={drill.steps}
        keyExtractor={(_, index) => `${drill.id}-step-${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.stepRow}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepIndex}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{item}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />}
        contentContainerStyle={{ paddingBottom: spacing.section * 2 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default DrillDetailScreen;
