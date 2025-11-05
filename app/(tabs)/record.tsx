import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { api } from "../api/client";

const MAX_DURATION_MS = 30_000;

type IntervalHandle = ReturnType<typeof setInterval> | null;
type TimeoutHandle = ReturnType<typeof setTimeout> | null;

type FlashMode = "off" | "torch";

type CameraPosition = "front" | "back";

const formatElapsed = (elapsed: number) => {
  const seconds = Math.min(elapsed / 1000, MAX_DURATION_MS / 1000);
  return seconds.toFixed(1);
};

const RecordScreen: React.FC = () => {
  const cameraRef = useRef<CameraView>(null);
  const shimmer = useRef(new Animated.Value(0)).current;
  const shimmerLoop = useRef<Animated.CompositeAnimation | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>("back");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [recording, setRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<IntervalHandle>(null);
  const autoStopRef = useRef<TimeoutHandle>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const startShimmer = useCallback(() => {
    shimmerLoop.current?.stop();
    shimmer.setValue(0);
    shimmerLoop.current = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    shimmerLoop.current.start();
  }, [shimmer]);

  const stopShimmer = useCallback(() => {
    shimmerLoop.current?.stop();
    shimmerLoop.current = null;
  }, []);

  useEffect(() => {
    if (recording) {
      startShimmer();
    } else {
      stopShimmer();
    }
  }, [recording, startShimmer, stopShimmer]);

  const startTimer = useCallback(() => {
    setElapsedMs(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedMs((prev) => prev + 100);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!cameraPermission?.granted) requestCameraPermission();
    if (!micPermission?.granted) requestMicPermission();
  }, [cameraPermission, micPermission, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    return () => {
      stopTimer();
      stopShimmer();
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
    };
  }, [stopTimer, stopShimmer]);

  const analyzeMutation = useMutation({
    mutationFn: async (uri: string) => {
      await FileSystem.getInfoAsync(uri);
      return api.postAnalyze(uri);
    },
    onSuccess: () => {
      Alert.alert("Clip submitted", "We\'ll crunch the numbers and notify you when it\'s ready.");
      setVideoUri(null);
      setShowActions(false);
      setElapsedMs(0);
    },
    onError: () => {
      Alert.alert("Upload failed", "Please try again.");
      setShowActions(true);
    },
  });

  const ensurePermissions = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert("Camera blocked", "We need access to record your shot.");
        return false;
      }
    }
    if (!micPermission?.granted) {
      const { granted } = await requestMicPermission();
      if (!granted) {
        Alert.alert("Mic blocked", "Enable your microphone so we can capture audio cues.");
        return false;
      }
    }
    return true;
  };

  const handleRecordPress = async () => {
    try {
      const ready = await ensurePermissions();
      if (!ready) return;
      if (!cameraRef.current) {
        Alert.alert("Flick", "Camera is still warming up. Give it a second.");
        return;
      }

      if (analyzeMutation.isPending) {
        return;
      }

      if (recording) {
        await cameraRef.current.stopRecording();
        return;
      }

      setRecording(true);
      setShowActions(false);
      setVideoUri(null);
      startTimer();

      const promise = cameraRef.current.recordAsync({ maxDuration: MAX_DURATION_MS / 1000 });
      autoStopRef.current = setTimeout(() => {
        cameraRef.current?.stopRecording();
      }, MAX_DURATION_MS + 200);

      const video = await promise;

      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }

      stopTimer();
      setRecording(false);

      if (video?.uri) {
        setVideoUri(video.uri);
        setShowActions(true);
      }
    } catch (error) {
      console.error("record error", error);
      stopTimer();
      setRecording(false);
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
      Alert.alert("Recording failed", "We couldn\'t save that clip. Try once more?");
    }
  };

  const toggleFlash = () => {
    setFlashMode((prev) => (prev === "off" ? "torch" : "off"));
  };

  const toggleCamera = () => {
    setCameraPosition((prev) => (prev === "back" ? "front" : "back"));
  };

  const handleSubmit = () => {
    if (!videoUri) return;
    setShowActions(false);
    analyzeMutation.mutate(videoUri);
  };

  const handleDiscard = () => {
    Alert.alert("Remove clip?", "This takes the recording out of your queue.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setVideoUri(null);
          setShowActions(false);
          setElapsedMs(0);
        },
      },
    ]);
  };

  if (!cameraPermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fe646f" />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>We need access to your camera</Text>
        <Text style={styles.permissionSubtitle}>
          Flick uses your clips to map mechanics and personalize your training plan.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={cameraPosition}
        flash={flashMode}
        mode="video"
      />

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.circleControl}
            onPress={() => router.replace("/(tabs)/progress")}
            accessibilityLabel="Exit recording"
          >
            <Ionicons name="close" size={22} color="#f5f5f5" />
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={16} color="#ff8a9b" />
            <Text style={styles.timerText}>{formatElapsed(elapsedMs)}s</Text>
          </View>
        </View>

        {recording && (
          <View style={styles.analyzingWrapper}>
            <LinearGradient
              colors={["#fff4f7", "#ffe4f0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.analyzingPill}
            >
              <Text style={styles.analyzingText}>Coach Flick is analyzing…</Text>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.analyzingHighlight,
                  {
                    transform: [
                      {
                        translateX: shimmer.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 140],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </LinearGradient>
          </View>
        )}
      </SafeAreaView>

      <View style={styles.poseOverlay} pointerEvents="none">
        <Text style={styles.poseText}>Pose tracking overlay arriving soon</Text>
      </View>

      <SafeAreaView
        style={[styles.bottomSafeArea, { paddingBottom: Math.max(insets.bottom + 18, 28) }]}
        pointerEvents="box-none"
      >
        <View style={[styles.bottomRow, showActions && styles.bottomRowActions]}>
          {!showActions && (
            <TouchableOpacity style={styles.bottomIcon} onPress={toggleFlash}>
              <Ionicons
                name={flashMode === "torch" ? "flash" : "flash-outline"}
                size={24}
                color="#f8fafc"
              />
            </TouchableOpacity>
          )}

          {!showActions && (
            <TouchableOpacity
              style={[styles.recordControl, recording && styles.recordControlActive]}
              onPress={handleRecordPress}
              accessibilityRole="button"
              accessibilityLabel={recording ? "Stop recording" : "Start recording"}
            >
              <View style={styles.recordInner}>
                <View style={[styles.recordDot, recording && styles.recordDotActive]} />
              </View>
            </TouchableOpacity>
          )}

          {showActions && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionPill, styles.removePill]} onPress={handleDiscard}>
                <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionPill, styles.submitPill]}
                onPress={handleSubmit}
                disabled={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.actionText, styles.submitText]}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {!showActions && (
            <TouchableOpacity style={styles.bottomIcon} onPress={toggleCamera}>
              <Ionicons name="camera-reverse-outline" size={26} color="#f8fafc" />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  circleControl: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(12,12,12,0.65)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  timerText: {
    color: "#ffe1e9",
    fontSize: 16,
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.4,
  },
  analyzingWrapper: {
    marginTop: 18,
    alignItems: "center",
  },
  analyzingPill: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    overflow: "hidden",
  },
  analyzingText: {
    fontSize: 14,
    color: "#7f1d1d",
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.3,
  },
  analyzingHighlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 48,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  poseOverlay: {
    position: "absolute",
    top: "20%",
    left: 24,
    right: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.35)",
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
  },
  poseText: {
    color: "#e2e8f0",
    textAlign: "center",
    fontSize: 13,
    letterSpacing: 0.4,
    fontFamily: "Montserrat-SemiBold",
  },
  bottomSafeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 36,
  },
  bottomRowActions: {
    justifyContent: "center",
  },
  bottomIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  recordControl: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 6,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  recordControlActive: {
    borderColor: "rgba(254,100,111,0.35)",
  },
  recordInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  recordDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f87171",
  },
  recordDotActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ef4444",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flexGrow: 1,
    maxWidth: 320,
  },
  actionPill: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 16,
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.4,
  },
  removePill: {
    backgroundColor: "rgba(15,23,42,0.55)",
    borderWidth: 1,
    borderColor: "rgba(248,250,252,0.4)",
  },
  removeText: {
    color: "#f8fafc",
  },
  submitPill: {
    backgroundColor: "#fe4f61",
  },
  submitText: {
    color: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#050505",
  },
  permissionTitle: {
    fontSize: 22,
    color: "#f8fafc",
    textAlign: "center",
    fontFamily: "Montserrat-Bold",
    marginBottom: 12,
  },
  permissionSubtitle: {
    fontSize: 15,
    color: "#cbd5f5",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    fontFamily: "Montserrat-SemiBold",
  },
  permissionButton: {
    backgroundColor: "#fe4f61",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.5,
  },
});

export default RecordScreen;
