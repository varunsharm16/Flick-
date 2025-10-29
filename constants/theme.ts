/**
 * Central theme tokens for the Flick app. Colors are provided for light and dark
 * mode along with shared spacing and typography scales. All screens and
 * components should consume these tokens to ensure a consistent look and feel.
 */

export type ColorSchemeKey = 'light' | 'dark';

export type AppColorPalette = typeof Colors.light;

export const Colors = {
  light: {
    text: '#11181C',
    muted: '#6C6C70',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E5E5EA',
    tint: '#FF6F3C',
    accent: '#FF6F3C',
    accentSoft: '#FFD4C4',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#FF6F3C',
    overlay: 'rgba(0,0,0,0.08)',
  },
  dark: {
    text: '#ECEDEE',
    muted: '#9BA1A6',
    background: '#0F1013',
    surface: '#1C1D21',
    surfaceElevated: '#24252B',
    border: '#2E3036',
    tint: '#FF7A45',
    accent: '#FF7A45',
    accentSoft: '#402418',
    success: '#3DDC84',
    warning: '#FFB648',
    danger: '#FF6B6B',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FF7A45',
    overlay: 'rgba(0,0,0,0.4)',
  },
};

export const Spacing = {
  screenHorizontal: 20,
  screenVertical: 24,
  section: 16,
  itemGap: 12,
  cardRadius: 16,
};

export const Typography = {
  headline: 28,
  title: 24,
  subtitle: 18,
  body: 16,
  small: 14,
  caption: 12,
};

