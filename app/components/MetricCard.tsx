import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ProBadge from './ProBadge';
import { AppTheme, AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

interface MetricCardProps {
  title: string;
  value: string;
  deltaLabel?: string;
  deltaPositive?: boolean;
  note?: string;
  requiresPro?: boolean;
  locked?: boolean;
  onPress?: () => void;
}

const createStyles = (colors: AppThemeColors, spacing: AppTheme['spacing'], typography: AppTheme['typography']) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: spacing.cardRadius,
      padding: spacing.section,
      gap: spacing.itemGap / 1.2,
      minHeight: 140,
      justifyContent: 'space-between',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    locked: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: typography.body,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: spacing.itemGap / 2,
    },
    value: {
      fontSize: typography.headline,
      fontWeight: '700',
      color: colors.text,
    },
    deltaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    deltaText: {
      fontSize: typography.small,
      fontWeight: '600',
    },
    deltaSuffix: {
      fontSize: 12,
      color: colors.muted,
    },
    note: {
      fontSize: typography.small,
      color: colors.muted,
    },
    lockBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 6,
    },
    lockText: {
      color: colors.accent,
      fontWeight: '600',
    },
  });

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  deltaLabel,
  deltaPositive,
  note,
  requiresPro,
  locked,
  onPress,
}) => {
  const { colors, spacing, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, spacing, typography), [colors, spacing, typography]);
  const deltaColor = deltaPositive ? colors.success : colors.danger;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        locked && styles.locked,
        pressed && onPress ? { transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {requiresPro && <ProBadge active={!locked} />}
      </View>
      <Text style={styles.value}>{value}</Text>
      {deltaLabel && (
        <View style={styles.deltaRow}>
          <Ionicons
            name={deltaPositive ? 'arrow-up' : 'arrow-down'}
            size={14}
            color={deltaColor}
          />
          <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaLabel}</Text>
          <Text style={styles.deltaSuffix}>vs last period</Text>
        </View>
      )}
      {note && <Text style={styles.note}>{note}</Text>}
      {locked && (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={16} color={colors.accent} />
          <Text style={styles.lockText}>Upgrade to unlock</Text>
        </View>
      )}
    </Pressable>
  );
};

export default MetricCard;
