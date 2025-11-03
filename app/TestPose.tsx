import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

import PoseOverlay from '../components/pose/PoseOverlay';
import { useQuickPose } from '../hooks/useQuickPose';

const TestPose = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const processingRef = useRef(false);
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const { isReady, latestPose, processFrame, isNative } = useQuickPose();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!permission?.granted) return;

    let isActive = true;
    let animationFrame: number;

    const analyse = async () => {
      if (!isActive) return;
      animationFrame = requestAnimationFrame(analyse);

      if (!cameraRef.current || !isReady || processingRef.current) {
        return;
      }

      try {
        processingRef.current = true;
        const captured = await cameraRef.current.takePictureAsync({
          quality: 0.3,
          skipProcessing: true,
          base64: false,
        });

        if (captured) {
          await processFrame(captured);
        }
      } catch (error) {
        console.warn('QuickPose frame capture failed', error);
      } finally {
        processingRef.current = false;
      }
    };

    animationFrame = requestAnimationFrame(analyse);

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [isReady, permission?.granted, processFrame]);

  const statusText = useMemo(() => {
    if (!permission) return 'Requesting camera access…';
    if (!permission.granted) return 'Camera permission is required to run pose estimation.';
    if (!isReady) return 'Loading QuickPose processor…';
    return 'QuickPose ready';
  }, [isReady, permission]);

  const toggleCamera = () => {
    setCameraType((current) => (current === 'front' ? 'back' : 'front'));
  };

  return (
    <View style={styles.container}>
      {permission?.granted ? (
        <View style={styles.cameraWrapper}>
          <CameraView
            ref={(ref) => {
              cameraRef.current = ref;
            }}
            facing={cameraType}
            style={StyleSheet.absoluteFill}
            onCameraReady={() => console.log('Camera ready for QuickPose')}
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

          <View style={styles.statusPill}>
            {!isReady ? <ActivityIndicator color="#0ea5e9" /> : <View style={styles.statusDot} />}
            <Text style={styles.statusText}>{statusText}</Text>
            <Text style={styles.statusChip}>{isNative ? 'native' : 'expo shim'}</Text>
          </View>

          <View style={styles.toolbar}>
            <Text style={styles.toolbarButton} onPress={toggleCamera}>
              Flip camera
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.centerContent}>
          <ActivityIndicator />
          <Text style={styles.permissionText}>{statusText}</Text>
          {permission && !permission.canAskAgain ? (
            <Text style={styles.permissionText}>Please enable camera permissions from device settings.</Text>
          ) : (
            <Text style={styles.permissionButton} onPress={requestPermission}>
              Grant permission
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraWrapper: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  statusPill: {
    position: 'absolute',
    top: Platform.select({ ios: 64, android: 32, default: 16 }),
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
  },
  statusChip: {
    marginLeft: 8,
    color: '#38bdf8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  toolbar: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  toolbarButton: {
    color: 'white',
    fontWeight: '600',
  },
  permissionText: {
    textAlign: 'center',
    color: '#94a3b8',
  },
  permissionButton: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
});

export default TestPose;
