import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PoseOverlay from '../../components/pose/PoseOverlay';
import { useQuickPose } from '../../hooks/useQuickPose';
import { api } from '../../api/client';

const formatTime = (value: number) => {
  const seconds = Math.floor(value / 1000);
  const ms = Math.floor((value % 1000) / 10);
  const paddedSeconds = seconds.toString().padStart(2, '0');
  const paddedMs = ms.toString().padStart(2, '0');
  return `${paddedSeconds}.${paddedMs}`;
};

export default function RecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const processingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [clipUri, setClipUri] = useState<string | null>(null);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });

  const { isReady, latestPose, processFrame } = useQuickPose();

  const uploadMutation = useMutation({
    mutationFn: async (uri: string) => {
      await FileSystem.getInfoAsync(uri);
      return api.postAnalyze(uri);
    },
    onSuccess: () => {
      Alert.alert('Uploaded', 'Your clip is on its way to your coach.');
      setClipUri(null);
      setElapsedMs(0);
      router.replace('/(tabs)/progress');
    },
    onError: () => {
      Alert.alert('Upload failed', 'Please try again.');
    },
  });

  useEffect(() => {
    if (!cameraPermission) {
      requestCameraPermission();
    }
    if (!micPermission) {
      requestMicPermission();
    }
  }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    if (!cameraPermission?.granted || !isReady) return;

    let isActive = true;
    let animationFrame: number;

    const analyse = async () => {
      if (!isActive) return;
      animationFrame = requestAnimationFrame(analyse);

      if (!cameraRef.current || processingRef.current || isRecording) {
        return;
      }

      try {
        processingRef.current = true;
        const captured = await cameraRef.current.takePictureAsync({
          quality: 0.4,
          skipProcessing: true,
        });

        if (captured) {
          await processFrame(captured);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('QuickPose capture failed', error);
        }
      } finally {
        processingRef.current = false;
      }
    };

    animationFrame = requestAnimationFrame(analyse);

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [cameraPermission?.granted, isReady, processFrame, isRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const permissionsGranted = useMemo(
    () => cameraPermission?.granted && micPermission?.granted,
    [cameraPermission?.granted, micPermission?.granted],
  );

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedMs((prev) => prev + 50);
    }, 50);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRecordPress = async () => {
    if (!permissionsGranted) {
      await Promise.all([requestCameraPermission(), requestMicPermission()]);
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Camera not ready', 'Hang tight, the lens is warming up.');
      return;
    }

    if (isRecording) {
      stopTimer();
      await cameraRef.current.stopRecording();
      return;
    }

    try {
      setClipUri(null);
      setIsRecording(true);
      setElapsedMs(0);
      startTimer();

      const recording = await cameraRef.current.recordAsync({ maxDuration: 30 });

      stopTimer();
      setIsRecording(false);

      if (recording?.uri) {
        setClipUri(recording.uri);
      } else {
        setElapsedMs(0);
      }
    } catch (error) {
      stopTimer();
      setIsRecording(false);
      setClipUri(null);
      setElapsedMs(0);
      Alert.alert('Recording failed', 'We could not capture that clip. Try again.');
      if (__DEV__) {
        console.error('Recording error', error);
      }
    }
  };

  const handleSubmit = () => {
    if (!clipUri) return;
    uploadMutation.mutate(clipUri);
  };

  const handleRemove = () => {
    if (!clipUri) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Remove this clip?');
      if (confirmed) {
        setClipUri(null);
        setElapsedMs(0);
      }
      return;
    }

    Alert.alert('Discard clip?', 'This action cannot be undone.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setClipUri(null);
          setElapsedMs(0);
        },
      },
    ]);
  };

  const toggleCamera = () => {
    setCameraType((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  if (!cameraPermission || !micPermission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#FF3B30" size="large" />
        <Text style={styles.loadingText}>Setting up your shooting lane…</Text>
      </View>
    );
  }

  if (!permissionsGranted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>We need access to your camera and mic.</Text>
        <Text style={styles.permissionSubtitle}>Grant access to capture and analyse your shot.</Text>
        <Pressable
          style={({ pressed }) => [styles.permissionButton, pressed && styles.permissionButtonPressed]}
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Grant permissions</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={(ref) => {
          cameraRef.current = ref;
        }}
        facing={cameraType}
        style={StyleSheet.absoluteFill}
        mode="video"
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setCameraLayout({ width, height });
        }}
      />

      {!!latestPose && cameraLayout.width > 0 && (
        <PoseOverlay
          landmarks={latestPose.landmarks}
          width={cameraLayout.width}
          height={cameraLayout.height}
          mirrored={cameraType === 'front'}
        />
      )}

      <LinearGradient
        colors={['rgba(5, 9, 23, 0.9)', 'transparent']}
        locations={[0, 0.4]}
        style={[styles.topGradient, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.topBar}>
          <View style={styles.timerPill}>
            <View style={[styles.statusDot, (isRecording || clipUri) && styles.statusDotActive]} />
            <Text style={styles.timerLabel}>{formatTime(isRecording ? elapsedMs : clipUri ? elapsedMs : 0)}</Text>
          </View>
          <Pressable style={styles.flipButton} onPress={toggleCamera}>
            <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
          </Pressable>
        </View>
        {!isReady && (
          <View style={styles.quickPosePill}>
            <ActivityIndicator color="#34D399" size="small" />
            <Text style={styles.quickPoseText}>Calibrating MediaPipe…</Text>
          </View>
        )}
      </LinearGradient>

      <LinearGradient
        colors={['transparent', 'rgba(5, 9, 23, 0.95)']}
        locations={[0.3, 1]}
        style={[styles.bottomGradient, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {clipUri ? (
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={handleRemove}
            >
              <Ionicons name="trash-outline" size={18} color="#FF453A" />
              <Text style={styles.secondaryLabel}>Remove</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={handleSubmit}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                  <Text style={styles.primaryLabel}>Submit</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.recordControls}>
            <Pressable
              onPress={handleRecordPress}
              style={({ pressed }) => [styles.recordOuter, pressed && styles.recordOuterPressed]}
            >
              <LinearGradient
                colors={['#FF5F6D', '#FF3B30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.recordInner, isRecording && styles.recordInnerActive]}
              >
                {isRecording && <View style={styles.stopSquare} />}
              </LinearGradient>
            </Pressable>
            <Text style={styles.hintText}>{isRecording ? 'Tap to stop' : 'Tap to start recording'}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
    backgroundColor: '#050917',
  },
  permissionTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '700',
  },
  permissionSubtitle: {
    color: 'rgba(226, 232, 240, 0.72)',
    textAlign: 'center',
    fontSize: 14,
  },
  permissionButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    marginTop: 8,
  },
  permissionButtonPressed: {
    opacity: 0.85,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  timerLabel: {
    color: '#F8FAFC',
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(148, 163, 184, 0.7)',
  },
  statusDotActive: {
    backgroundColor: '#FF453A',
    shadowColor: '#FF453A',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPosePill: {
    marginTop: 16,
    marginLeft: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickPoseText: {
    color: '#A5F3FC',
    fontSize: 14,
    fontWeight: '600',
  },
  recordControls: {
    alignItems: 'center',
    gap: 16,
  },
  recordOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 5,
    backgroundColor: 'rgba(255, 91, 91, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordOuterPressed: {
    transform: [{ scale: 0.96 }],
  },
  recordInner: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  recordInnerActive: {
    borderRadius: 24,
  },
  stopSquare: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  hintText: {
    color: 'rgba(226, 232, 240, 0.86)',
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderRadius: 999,
    paddingVertical: 16,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 999,
    paddingVertical: 16,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  secondaryLabel: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
