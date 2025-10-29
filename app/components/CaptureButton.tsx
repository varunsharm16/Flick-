import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';

interface CaptureButtonProps {
  disabled?: boolean;
  recording?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onPress?: () => void;
}

const CaptureButton: React.FC<CaptureButtonProps> = ({ disabled, recording = false, onPressIn, onPressOut, onPress }) => {
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
      <View style={[styles.outerRing, recording && styles.outerRingActive]}>
        <View style={[styles.innerCircle, recording && styles.innerCircleActive]} />
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
  outerRingActive: {
    borderColor: '#FF3B30'
  },
  innerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30'
  },
  innerCircleActive: {
    borderRadius: 16
  }
});

export default CaptureButton;
