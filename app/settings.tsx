import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useSession, ThemeOption } from './store/useSession';
import { AppTheme, AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

const themeOptions: ThemeOption[] = ['light', 'dark', 'system'];

const createStyles = (colors: AppThemeColors, spacing: AppTheme['spacing'], typography: AppTheme['typography']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.screenHorizontal,
      paddingTop: spacing.screenVertical,
      paddingBottom: spacing.section * 4,
      gap: spacing.section,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: spacing.cardRadius,
      padding: spacing.section,
      gap: spacing.itemGap,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: typography.subtitle,
      fontWeight: '700',
      color: colors.text,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    label: {
      fontSize: typography.body,
      color: colors.text,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
  });

const SettingsScreen: React.FC = () => {
  const { colors, spacing, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, spacing, typography), [colors, spacing, typography]);
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
            trackColor={{ true: colors.accent, false: colors.border }}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Theme</Text>
        {themeOptions.map((option) => {
          const selected = theme === option;
          return (
            <Pressable key={option} style={styles.row} onPress={() => setTheme(option)}>
              <Text style={styles.label}>{option.toUpperCase()}</Text>
              <View style={styles.radio}>{selected && <View style={styles.radioInner} />}</View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default SettingsScreen;
