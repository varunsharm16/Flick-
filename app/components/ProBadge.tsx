import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

interface ProBadgeProps {
  active?: boolean;
}

const createStyles = (colors: AppThemeColors) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    badgeInactive: {
      backgroundColor: colors.accentSoft,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      letterSpacing: 1,
    },
    textInactive: {
      color: colors.accent,
    },
  });

const ProBadge: React.FC<ProBadgeProps> = ({ active = true }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.badge, !active && styles.badgeInactive]}>
      <Text style={[styles.text, !active && styles.textInactive]}>PRO</Text>
    </View>
  );
};

export default ProBadge;
