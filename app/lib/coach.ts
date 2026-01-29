// app/lib/coach.ts
import { Alert, Platform } from "react-native";

const SERVER_URL = __DEV__
  ? "http://192.168.0.120:5050" // if using local simulator
  : "https://<your-deployed-server-url>"; // if hosted online later

export async function pushSessionSummary(summary: any) {
  try {
    const res = await fetch(`${SERVER_URL}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(summary),
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    console.log("✅ Sent summary:", data);

    if (Platform.OS === "android") {
      Alert.alert("Coach Upload", "Session uploaded successfully!");
    } else {
      Alert.alert("✅ Coach", "Session uploaded successfully!");
    }
  } catch (err: any) {
    console.error("❌ Upload failed:", err);
    Alert.alert("Upload failed", err.message);
  }
}
