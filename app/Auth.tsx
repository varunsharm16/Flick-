import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import { supabase } from "./lib/supabase";

WebBrowser.maybeCompleteAuthSession();

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

  const parseAuthParams = (url: string | undefined, params?: Record<string, string>) => {
    const collectedParams: Record<string, string> = { ...(params ?? {}) };

    if (!url) {
      return collectedParams;
    }

    try {
      const parsedUrl = Linking.parse(url);
      if (parsedUrl?.queryParams) {
        Object.entries(parsedUrl.queryParams).forEach(([key, value]) => {
          if (typeof value === "string") {
            collectedParams[key] = value;
          }
        });
      }

      const hashIndex = url.indexOf("#");
      if (hashIndex !== -1) {
        const hash = url.substring(hashIndex + 1);
        if (typeof URLSearchParams !== "undefined") {
          const searchParams = new URLSearchParams(hash);
          searchParams.forEach((value, key) => {
            collectedParams[key] = value;
          });
        }
      }
    } catch (parseError) {
      console.warn("Failed to parse auth redirect URL", parseError);
    }

    return collectedParams;
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      const isExpoGo = Constants.appOwnership === "expo";
      const redirectPath = Platform.OS === "web" ? "Auth" : "auth-callback";
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: Platform.OS === "web" ? undefined : "flick",
        path: redirectPath,
        useProxy: Platform.OS !== "web" && isExpoGo,
      });

      if (Platform.OS === "web") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) {
          throw error;
        }

        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      const authUrl = data?.url;

      if (!authUrl) {
        throw new Error("No authentication URL returned. Please try again.");
      }

      await WebBrowser.warmUpAsync();

      const result = await AuthSession.startAsync({ authUrl, returnUrl: redirectUrl });

      if (result.type !== "success") {
        if (result.type === "dismiss" || result.type === "cancel") {
          throw new Error("Authentication was canceled. Please try again.");
        }

        throw new Error("Unable to complete authentication. Please try again.");
      }

      if (Platform.OS !== "web") {
        try {
          await WebBrowser.dismissBrowser();
        } catch (dismissError) {
          console.warn("Failed to dismiss web browser", dismissError);
        }
      }

      const authParams = parseAuthParams(result.url, result.params as Record<string, string> | undefined);

      if (authParams.error) {
        throw new Error(authParams.error_description ?? authParams.error ?? "Authentication failed");
      }

      if (authParams.access_token && authParams.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: authParams.access_token,
          refresh_token: authParams.refresh_token,
        });

        if (sessionError) {
          throw sessionError;
        }
      } else if (authParams.code) {
        const { error: sessionError } = await supabase.auth.exchangeCodeForSession({
          authCode: authParams.code,
        });

        if (sessionError) {
          throw sessionError;
        }
      } else {
        throw new Error("No authentication response received. Please try again.");
      }

      router.replace("/(tabs)/progress");
    } catch (error: any) {
      console.error("Google sign-in failed", error);
      showError(error?.message ?? "Unable to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
      if (Platform.OS !== "web") {
        try {
          await WebBrowser.coolDownAsync();
        } catch (coolDownError) {
          console.warn("Failed to cool down web browser", coolDownError);
        }
      }
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
