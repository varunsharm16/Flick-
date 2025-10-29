import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { AppColorPalette, ColorSchemeKey, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from './use-color-scheme';

export const useAppTheme = () => {
  const scheme = useColorScheme();
  const resolved: ColorSchemeKey = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[resolved];

  const sharedStyles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: Spacing.screenHorizontal,
          paddingTop: Spacing.screenVertical,
          paddingBottom: Spacing.screenVertical,
        },
        surface: {
          backgroundColor: colors.surface,
          borderRadius: Spacing.cardRadius,
        },
        title: {
          color: colors.text,
          fontSize: Typography.title,
          fontWeight: '700',
        },
        subtitle: {
          color: colors.muted,
          fontSize: Typography.body,
        },
        mutedText: {
          color: colors.muted,
        },
        separator: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
        },
      }),
    [colors],
  );

  return {
    colorScheme: resolved,
    colors,
    spacing: Spacing,
    typography: Typography,
    sharedStyles,
  };
};

export type AppTheme = ReturnType<typeof useAppTheme>;

export type AppThemeColors = AppColorPalette;
