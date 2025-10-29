import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';

interface CaptureButtonProps {
  disabled?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onPress?: () => void;
}

const CaptureButton: React.FC<CaptureButtonProps> = ({ disabled, onPressIn, onPressOut, onPress }) => {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrapper,
        pressed && !disabled && { transform: [{ scale: 0.95 }] },
        disabled && { opacity: 0.4 }
      ]}
    >
      <View style={styles.outerRing}>
        <View style={styles.innerCircle} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  outerRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30'
  }
});

export default CaptureButton;
