import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

interface CaptureButtonProps {
  disabled?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onPress?: () => void;
}

const createStyles = (colors: AppThemeColors) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    outerRing: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 6,
      borderColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff20',
    },
    innerCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.danger,
    },
  });

const CaptureButton: React.FC<CaptureButtonProps> = ({ disabled, onPressIn, onPressOut, onPress }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrapper,
        pressed && !disabled ? { transform: [{ scale: 0.95 }] } : null,
        disabled ? { opacity: 0.4 } : null,
      ]}
    >
      <View style={styles.outerRing}>
        <View style={styles.innerCircle} />
      </View>
    </Pressable>
  );
};

export default CaptureButton;
