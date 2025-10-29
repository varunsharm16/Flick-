import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// import { Camera, CameraType } from 'expo-camera';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';


import * as FileSystem from 'expo-file-system';
import { ToastAndroid } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';

import CaptureButton from './components/CaptureButton';
import { api } from './api/client';

const RecordScreen: React.FC = () => {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

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
      navigation.navigate('Progress' as never);
    },
    onError: () => {
      Alert.alert('Upload failed', 'Please try again.');
    }
  });

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [cameraPermission, micPermission]);


  const handleRecord = async () => {
    try {
      if (!cameraPermission?.granted || !micPermission?.granted) {
        ToastAndroid.show('Camera or mic permission not granted', ToastAndroid.SHORT);
        return;
      }

      if (recording) {
        await cameraRef.current?.stopRecording();
        setRecording(false);
        ToastAndroid.show('Recording stopped', ToastAndroid.SHORT);
        return;
      }

      setRecording(true);

      // start recording (no options object)
      const recordingPromise = cameraRef.current?.recordAsync();

      // enforce 30s max
      const stopTimer = setTimeout(() => {
        cameraRef.current?.stopRecording();
      }, 30_000);

      const video = await recordingPromise;
      clearTimeout(stopTimer);

      setRecording(false);

      if (video?.uri) {
        setVideoUri(video.uri);
        ToastAndroid.show('Recording saved', ToastAndroid.SHORT);
      } else {
        throw new Error('No video URI');
      }
    } catch (err) {
      console.error('Recording error:', err);
      ToastAndroid.show('Recording error, unable to capture video', ToastAndroid.SHORT);
      setRecording(false);
    }
  };


  if (!cameraPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6F3C" />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>We need your permission to show the camera.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}      // 'front' | 'back'
        mode="video"             // optional; defaults are OK too
      />





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
                  <Text style={styles.modalButtonText}>Save & Analyze</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  permissionText: {
    fontSize: 16,
    color: '#1c1c1e',
    textAlign: 'center',
    marginBottom: 16
  },
  permissionButton: {
    backgroundColor: '#FF6F3C',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  captureContainer: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  recordingLabel: {
    color: '#fff',
    marginTop: 12,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    gap: 12
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center'
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#6c6c70',
    textAlign: 'center'
  },
  modalActions: {
    flexDirection: 'column',
    gap: 12
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  secondaryButton: {
    backgroundColor: '#f2f2f7'
  },
  secondaryButtonText: {
    color: '#1c1c1e'
  },
  primaryButton: {
    backgroundColor: '#FF6F3C'
  },
  camera: { flex: 1 }
});

export default RecordScreen;
