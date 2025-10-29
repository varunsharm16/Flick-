import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';

import CaptureButton from './components/CaptureButton';
import { api } from './api/client';
import { RootTabParamList } from './navigation/types';
import { AppTheme, AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

const createStyles = (colors: AppThemeColors, spacing: AppTheme['spacing'], typography: AppTheme['typography']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.screenHorizontal,
      gap: spacing.itemGap,
    },
    permissionText: {
      fontSize: typography.body,
      color: colors.text,
      textAlign: 'center',
    },
    permissionButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: spacing.cardRadius,
    },
    permissionButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    camera: {
      flex: 1,
    },
    captureContainer: {
      position: 'absolute',
      bottom: spacing.section * 2.5,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordingLabel: {
      color: '#fff',
      marginTop: 12,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.screenHorizontal,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: spacing.cardRadius + 4,
      padding: spacing.section,
      width: '100%',
      maxWidth: 360,
      gap: spacing.itemGap,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: typography.subtitle,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: typography.body,
      color: colors.muted,
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'column',
      gap: spacing.itemGap,
    },
    modalButton: {
      paddingVertical: 14,
      borderRadius: spacing.cardRadius,
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: typography.body,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
    },
    primaryButton: {
      backgroundColor: colors.accent,
    },
  });

const RecordScreen: React.FC = () => {
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const { colors, sharedStyles, spacing, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, spacing, typography), [colors, spacing, typography]);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async (uri: string) => {
      await FileSystem.getInfoAsync(uri);
      return api.postAnalyze(uri);
    },
    onSuccess: () => {
      const message = 'Analysis queued. Check back in a minute.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert('Flick', message);
      }
      setModalVisible(false);
      setVideoUri(null);
      navigation.navigate('Progress');
    },
    onError: () => {
      Alert.alert('Upload failed', 'Please try again.');
    },
  });

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

  const handleRecord = async () => {
    try {
      if (!cameraPermission?.granted || !micPermission?.granted) {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Camera or mic permission not granted', ToastAndroid.SHORT);
        } else {
          Alert.alert('Flick', 'Camera or mic permission not granted');
        }
        return;
      }

      if (recording) {
        await cameraRef.current?.stopRecording();
        setRecording(false);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Recording stopped', ToastAndroid.SHORT);
        }
        return;
      }

      setRecording(true);
      const recordingPromise = cameraRef.current?.recordAsync();

      const stopTimer = setTimeout(() => {
        cameraRef.current?.stopRecording();
      }, 30_000);

      const video = await recordingPromise;
      clearTimeout(stopTimer);

      setRecording(false);

      if (video?.uri) {
        setVideoUri(video.uri);
        setModalVisible(true);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Recording saved', ToastAndroid.SHORT);
        }
      } else {
        throw new Error('No video URI');
      }
    } catch (err) {
      console.error('Recording error:', err);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Recording error, unable to capture video', ToastAndroid.SHORT);
      } else {
        Alert.alert('Recording error', 'Unable to capture video');
      }
      setRecording(false);
    }
  };

  if (!cameraPermission) {
    return (
      <View style={[sharedStyles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={[sharedStyles.screen, styles.centered]}>
        <Text style={styles.permissionText}>We need your permission to show the camera.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={cameraType} mode="video" />

      <View style={styles.captureContainer}>
        <CaptureButton onPress={handleRecord} disabled={recording} />
        {recording && <Text style={styles.recordingLabel}>Recording...</Text>}
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Great shot!</Text>
            <Text style={styles.modalSubtitle}>Save your clip for AI analysis?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => {
                  setModalVisible(false);
                  setVideoUri(null);
                }}
              >
                <Text style={[styles.modalButtonText, styles.secondaryButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => {
                  setModalVisible(false);
                  setVideoUri(null);
                  setCameraType((prev) => (prev === 'back' ? 'front' : 'back'));
                }}
              >
                <Text style={[styles.modalButtonText, styles.secondaryButtonText]}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  if (videoUri) {
                    analyzeMutation.mutate(videoUri);
                  }
                }}
                disabled={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save & Analyze</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RecordScreen;
