import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ToastAndroid,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CaptureButton from './components/CaptureButton';
import { api } from './api/client';

type IntervalHandle = ReturnType<typeof setInterval> | null;
type TimeoutHandle = ReturnType<typeof setTimeout> | null;

const RecordScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<IntervalHandle>(null);
  const autoStopRef = useRef<TimeoutHandle>(null);
  const navigation = useNavigation();

  const startTimer = () => {
    setElapsedMs(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setElapsedMs(prev => prev + 100);
    }, 100);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const fmt = (ms: number) => (ms / 1000).toFixed(2);

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
      setVideoUri(null);
      setShowActions(false);
      setElapsedMs(0);
      navigation.navigate('Progress' as never);
    },
    onError: () => {
      Alert.alert('Upload failed', 'Please try again.');
      setShowActions(true);
    }
  });

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
    };
  }, []);

  const toggleCamera = () => {
    setCameraType(prev => (prev === 'back' ? 'front' : 'back'));
  };

  const handleRecord = async () => {
    try {
      if (!cameraPermission?.granted || !micPermission?.granted) {
        const message = 'Camera or mic permission not granted';
        if (Platform.OS === 'android') {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Alert.alert('Flick', message);
        }
        return;
      }

      if (showActions || analyzeMutation.isPending) {
        return;
      }

      if (recording) {
        await cameraRef.current?.stopRecording();
        stopTimer();
        if (autoStopRef.current) {
          clearTimeout(autoStopRef.current);
          autoStopRef.current = null;
        }
        setRecording(false);
        const message = 'Recording stopped';
        if (Platform.OS === 'android') {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Alert.alert('Flick', message);
        }
        return;
      }

      if (!cameraRef.current) {
        Alert.alert('Flick', 'Camera is not ready yet.');
        return;
      }

      setRecording(true);
      setShowActions(false);
      setVideoUri(null);
      startTimer();

      const recordingPromise = cameraRef.current.recordAsync();
      autoStopRef.current = setTimeout(() => {
        cameraRef.current?.stopRecording();
      }, 30_000);

      const video = await recordingPromise;
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }

      stopTimer();
      setRecording(false);

      if (video?.uri) {
        setVideoUri(video.uri);
        setShowActions(true);
        const message = 'Recording saved';
        if (Platform.OS === 'android') {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Alert.alert('Flick', message);
        }
      } else {
        throw new Error('No video URI');
      }
    } catch (err) {
      console.error('Recording error:', err);
      stopTimer();
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
      const message = 'Recording error, unable to capture video';
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      } else {
        Alert.alert('Flick', message);
      }
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
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          mode="video"
        />
        <View style={[styles.topControls, { top: insets.top + 16 }]}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleCamera}>
            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={[styles.timerBadge, { top: insets.top + 8 }]}>
          <Text style={styles.timerText}>{fmt(elapsedMs)}s</Text>
        </View>
      </View>

      {!showActions && (
        <View style={[styles.captureContainer, { bottom: insets.bottom + 48 }]}>
          <CaptureButton onPress={handleRecord} recording={recording} disabled={analyzeMutation.isPending} />
          {recording && <Text style={styles.recordingLabel}>Recording...</Text>}
        </View>
      )}

      {showActions && (
        <View style={[styles.actionPillBar, { bottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            style={[styles.pillBtn, styles.secondary]}
            onPress={() => {
              Alert.alert('Discard clip?', 'This will delete the current recording.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    setVideoUri(null);
                    setShowActions(false);
                    setElapsedMs(0);
                  },
                },
              ]);
            }}
          >
            <Text style={[styles.pillText, styles.secondaryText]}>Remove</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pillBtn, styles.primary]}
            onPress={() => {
              if (videoUri) {
                setShowActions(false);
                setElapsedMs(0);
                analyzeMutation.mutate(videoUri);
              }
            }}
          >
            {analyzeMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.pillText, styles.primaryText]}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cameraWrapper: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    right: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center'
  },
  timerBadge: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12
  },
  timerText: {
    color: '#fff',
    fontWeight: '600'
  },
  recordingLabel: {
    color: '#fff',
    marginTop: 12,
    fontWeight: '600'
  },
  actionPillBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center'
  },
  pillText: {
    fontSize: 16,
    fontWeight: '700'
  },
  primary: {
    backgroundColor: '#FF6F3C'
  },
  primaryText: {
    color: '#fff'
  },
  secondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  secondaryText: {
    color: '#111827',
    fontWeight: '700'
  },
  camera: { flex: 1 }
});

export default RecordScreen;
