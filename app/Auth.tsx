import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "./lib/supabase";

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setLoading(false);
        router.replace("/(tabs)/progress");
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  const showError = (message: string) => {
    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert("Authentication Error", message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            Platform.OS === "web"
              ? `${window.location.origin}/Auth`
              : undefined,
        },
      });

      if (error) {
        throw error;
      }

      if (Platform.OS !== "web") {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }
        if (data.session) {
          router.replace("/(tabs)/progress");
        }
      }
    } catch (error: any) {
      console.error("Google sign-in failed", error);
      showError(error?.message ?? "Unable to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login or sign up to Flick</Text>
        <Text style={styles.subtitle}>Securely access your account with Google.</Text>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{loading ? "Connecting…" : "Continue with Google"}</Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>We'll open Google to complete your sign in.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0f0f0f",
    borderRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    color: "#f2f2f7",
    fontSize: 24,
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "Montserrat-SemiBold",
  },
  subtitle: {
    color: "#b0b0b5",
    fontSize: 14,
    marginBottom: 32,
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
  },
  button: {
    backgroundColor: "#FF6F3C",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#FF6F3C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#050505",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
  },
  helperText: {
    color: "#7c7c80",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
  },
});
