import React, { useEffect } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "./lib/supabase";
import { useAuthPersistence } from "./lib/useAuthPersistence";


export default function Index() {
  const router = useRouter();
  const isRestoring = useAuthPersistence();

  useEffect(() => {
    if (isRestoring) return; // wait until restore completes

    const redirect = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace("/(tabs)/profile");
          return;
        }

        if (Platform.OS === "web") {
          const hash = window.location.hash || "";
          router.replace(`/Auth${hash}`);
        } else {
          router.replace("/Auth");
        }
      } catch (error) {
        console.error("Failed to determine initial route:", error);
        router.replace("/Auth");
      }
    };

    redirect();
  }, [router, isRestoring]);

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050505",
  },
  loadingText: {
    color: "#f2f2f7",
    fontSize: 18,
    letterSpacing: 0.4,
    fontFamily: "Montserrat-SemiBold",
  },
});
