import { Platform } from 'react-native';

export type PoseLandmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type PoseEstimate = {
  landmarks: PoseLandmark[];
  timestamp: number;
};

export interface QuickPoseProcessor {
  estimate: (image: { uri: string; width: number; height: number }) => Promise<PoseEstimate | null>;
  dispose: () => void;
}

/**
 * Minimal Expo-compatible stub for the QuickPose native module.
 *
 * The actual quickpose-react-native-pose-estimation package exposes a native camera view and
 * pose estimation pipeline. Because we cannot bundle native source in the managed Expo runtime,
 * this adapter provides a JS-only shim that mimics the SDK shape so the rest of the app can be
 * wired up and tested inside Expo. When the real SDK is linked in an EAS build the consumer can
 * replace the internals of this file with direct calls to the native module.
 */
export const loadQuickPoseProcessor = async (): Promise<QuickPoseProcessor> => {
  // In a production build you should replace this shim with a direct bridge to the
  // `quickpose-react-native-pose-estimation` module. We keep the shim here so the
  // TestPose screen renders inside Expo Go and provides deterministic logs for QA.

  // Mimic MediaPipe's 33 landmarks in normalized [0,1] space.
  const LANDMARK_COUNT = 33;
  let disposed = false;

  const generateMockLandmarks = (): PoseLandmark[] => {
    const wavePhase = Date.now() / 500;
    return Array.from({ length: LANDMARK_COUNT }).map((_, index) => {
      const baseX = ((index % 11) + 1) / 12;
      const baseY = (Math.floor(index / 11) + 1) / 4;
      return {
        x: (baseX + 0.05 * Math.sin(wavePhase + index)) % 1,
        y: (baseY + 0.05 * Math.cos(wavePhase + index)) % 1,
        z: 0,
        visibility: 0.9,
      };
    });
  };

  return {
    estimate: async () => {
      if (disposed) {
        return null;
      }

      return {
        landmarks: generateMockLandmarks(),
        timestamp: Date.now(),
      };
    },
    dispose: () => {
      disposed = true;
    },
  };
};

export const isNativeQuickPoseAvailable = (): boolean => {
  // The upstream SDK exposes a native module. Because Expo Go cannot host it, we expose a helper
  // that callers can use to determine whether they are currently running in a development shim or
  // in a real EAS build that contains the native module.
  return Platform.OS !== 'web' && (globalThis as any).__quickPoseNative === true;
};
