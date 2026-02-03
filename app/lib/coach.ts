// app/lib/coach.ts
import { Alert, Platform } from "react-native";
import { supabase } from "./supabase";

const SERVER_URL = __DEV__
  ? "http://192.168.0.120:5050" // if using local simulator
  : "https://<your-deployed-server-url>"; // if hosted online later

/**
 * Get the current user's access token for authenticated API requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  };
}

/**
 * Push a session summary to the AI coaching server
 */
export async function pushSessionSummary(summary: any) {
  try {
    const headers = await getAuthHeaders();

    const res = await fetch(`${SERVER_URL}/ingest`, {
      method: "POST",
      headers,
      body: JSON.stringify(summary),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || "Upload failed");
    }

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

/**
 * Query the AI coach for feedback
 */
export async function queryCoach(message: string): Promise<string> {
  try {
    const headers = await getAuthHeaders();

    const res = await fetch(`${SERVER_URL}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(errorData.error || "Query failed");
    }

    const data = await res.json();
    return data.reply;
  } catch (err: any) {
    console.error("❌ Query failed:", err);
    throw err;
  }
}
