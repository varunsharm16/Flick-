import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraCapturedPicture } from 'expo-camera';

import {
  QuickPoseProcessor,
  PoseEstimate,
  loadQuickPoseProcessor,
  isNativeQuickPoseAvailable,
} from '../lib/pose/quickpose-expo';

export type { PoseEstimate, PoseLandmark } from '../lib/pose/quickpose-expo';

type ProcessFrameArgs = CameraCapturedPicture & { skipLogging?: boolean };

export const useQuickPose = () => {
  const processorRef = useRef<QuickPoseProcessor | null>(null);
  const [latestPose, setLatestPose] = useState<PoseEstimate | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const processor = await loadQuickPoseProcessor();
        if (!mounted) return;
        processorRef.current = processor;
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialise QuickPose processor', error);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
      processorRef.current?.dispose();
      processorRef.current = null;
      setLatestPose(null);
      setIsReady(false);
    };
  }, []);

  const processFrame = useCallback(
    async (frame: ProcessFrameArgs) => {
      if (!processorRef.current) return null;

      const estimate = await processorRef.current.estimate({
        uri: frame.uri,
        width: frame.width ?? 0,
        height: frame.height ?? 0,
      });

      if (estimate) {
        setLatestPose(estimate);
        if (!frame.skipLogging) {
          console.log('[QuickPose] landmarks', JSON.stringify(estimate.landmarks));
        }
      }

      return estimate;
    },
    []
  );

  return {
    isReady,
    latestPose,
    processFrame,
    isNative: isNativeQuickPoseAvailable(),
  };
};
