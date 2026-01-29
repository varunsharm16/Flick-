import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import * as drawingUtils from "@mediapipe/drawing_utils";

export async function analyzePose(videoUri: string) {
  console.log("🧠 Mock analyzing pose from:", videoUri);
  
  // simulate a delay for "analysis"
  await new Promise((r) => setTimeout(r, 1500));

  // return fake but structured stats
  return {
    accuracy: Math.random() * 0.2 + 0.8, // 80–100%
    consistency: Math.random() * 0.2 + 0.7, // 70–90%
    speed: Math.random() * 0.3 + 0.6, // 60–90%
  };
}
