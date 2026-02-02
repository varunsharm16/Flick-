import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "./lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const hasNavigatedRef = useRef(false);
  const isProcessingAuthRef = useRef(false);

  // Navigate to profile once
  const navigateToProfile = useCallback(() => {
    if (hasNavigatedRef.current) {
      console.log("⏭️ Already navigated, skipping");
      return;
    }

    hasNavigatedRef.current = true;
    setLoading(false);
    console.log("✅ Navigating to profile");
    router.replace("/(tabs)/profile");
  }, [router]);

  // Listen for auth state changes (main navigation trigger)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, "Session:", !!session);

      if (session && event !== 'SIGNED_OUT') {
        navigateToProfile();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [navigateToProfile]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log("📱 Existing session found");
          navigateToProfile();
        }
      } catch (error) {
        console.warn("Session check failed:", error);
      }
    };

    checkSession();
  }, [navigateToProfile]);

  const showError = useCallback((message: string) => {
    setLoading(false);
    isProcessingAuthRef.current = false;

    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert("Authentication Error", message);
    }
  }, []);

  // Extract auth params from URL (handles both query params and hash fragments)
  const extractAuthParams = (url: string): Record<string, string> => {
    const params: Record<string, string> = {};

    try {
      // Parse query parameters
      const parsed = Linking.parse(url);
      if (parsed?.queryParams) {
        Object.entries(parsed.queryParams).forEach(([key, value]) => {
          if (typeof value === "string") {
            params[key] = value;
          }
        });
      }

      // Parse hash fragment (OAuth often returns tokens in hash)
      const hashIndex = url.indexOf("#");
      if (hashIndex !== -1) {
        const hash = url.substring(hashIndex + 1);
        const hashParams = new URLSearchParams(hash);
        hashParams.forEach((value, key) => {
          params[key] = value;
        });
      }
    } catch (error) {
      console.warn("Failed to parse URL:", error);
    }

    return params;
  };

  // Process authentication parameters
  const processAuthParams = async (params: Record<string, string>) => {
    // Check for errors first
    if (params.error) {
      throw new Error(params.error_description || params.error);
    }

    // Exchange code for session
    if (params.code) {
      console.log("🔄 Exchanging code for session");
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);

      if (error) throw error;
      console.log("✅ Code exchanged successfully");
      return;
    }

    // Or set session directly if we have tokens
    if (params.access_token && params.refresh_token) {
      console.log("🔄 Setting session with tokens");
      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });

      if (error) throw error;
      console.log("✅ Session set successfully");
      return;
    }

    throw new Error("No valid auth data received");
  };

  // Handle deep link redirects from OAuth
  const handleAuthCallback = useCallback(async (url: string) => {
    // Prevent duplicate processing
    if (isProcessingAuthRef.current) {
      console.log("⏸️ Already processing auth, skipping");
      return;
    }

    console.log("🔗 Handling auth callback:", url);

    const params = extractAuthParams(url);

    // Check if we have auth data
    const hasAuthData = params.code || params.access_token || params.error;
    if (!hasAuthData) {
      console.log("❌ No auth data in URL");
      return;
    }

    isProcessingAuthRef.current = true;

    try {
      await processAuthParams(params);
      // Session will be picked up by onAuthStateChange listener
    } catch (error: any) {
      console.error("❌ Auth callback failed:", error);
      showError(error?.message || "Authentication failed. Please try again.");
    } finally {
      isProcessingAuthRef.current = false;
    }
  }, [showError]);

  // Listen for deep links
  useEffect(() => {
    // Handle initial URL (if app was opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("📲 Initial URL:", url);
        handleAuthCallback(url);
      }
    });

    // Listen for subsequent deep links
    const subscription = Linking.addEventListener("url", (event) => {
      if (event?.url) {
        handleAuthCallback(event.url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleAuthCallback]);

  const handleAppleSignIn = async () => {
    if (loading || isProcessingAuthRef.current) {
      console.log("⏸️ Already loading or processing");
      return;
    }

    try {
      setLoading(true);
      isProcessingAuthRef.current = true;
      console.log("🍎 Starting Apple sign in");

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("🔑 Got Apple credential, exchanging with Supabase");

      if (!credential.identityToken) {
        throw new Error("No identity token received from Apple");
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) throw error;

      console.log("✅ Apple sign-in successful");
      // Session will be picked up by onAuthStateChange listener
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        console.log("👤 User cancelled Apple sign-in");
        setLoading(false);
        isProcessingAuthRef.current = false;
        return;
      }
      console.error("❌ Apple sign-in failed:", error);
      showError(error?.message || "Failed to sign in with Apple");
    } finally {
      setLoading(false);
      isProcessingAuthRef.current = false;
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || isProcessingAuthRef.current) {
      console.log("⏸️ Already loading or processing");
      return;
    }

    try {
      setLoading(true);
      console.log("🚀 Starting Google sign in");

      const isExpoGo = Constants.appOwnership === "expo";
      const redirectPath = Platform.OS === "web" ? "Auth" : "auth-callback";
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: Platform.OS === "web" ? undefined : "flick",
        path: redirectPath,
      });

      console.log("🔀 Redirect URL:", redirectUrl);

      // For web, use standard flow
      if (Platform.OS === "web") {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) throw error;
        return;
      }

      // For mobile, get the auth URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No authentication URL returned");

      console.log("🌐 Opening browser for auth");

      // Open the browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      console.log("📱 Browser result:", result.type);

      // Handle cancellation
      if (result.type === "cancel" || result.type === "dismiss") {
        setLoading(false);
        return;
      }

      // Handle success - process the result URL
      if (result.type === "success" && result.url) {
        console.log("🎯 Got result URL, processing...");
        isProcessingAuthRef.current = true;

        try {
          const params = extractAuthParams(result.url);
          console.log("📦 Extracted params:", Object.keys(params));

          await processAuthParams(params);

          // Give Supabase a moment to set the session
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if session is ready
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            console.log("✅ Session confirmed, navigating");
            navigateToProfile();
          } else {
            console.log("⏳ Waiting for session to be set...");
            // The onAuthStateChange listener will handle navigation
          }
        } catch (error: any) {
          console.error("❌ Failed to process auth result:", error);
          showError(error?.message || "Authentication failed");
        } finally {
          isProcessingAuthRef.current = false;
        }
      } else {
        console.log("❌ Unexpected browser result:", result.type);
        setLoading(false);
      }

    } catch (error: any) {
      console.error("❌ Google sign-in failed:", error);
      showError(error?.message || "Failed to sign in with Google");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login or sign up to Flick</Text>
        <Text style={styles.subtitle}>Securely access your account.</Text>
        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={[styles.appleButton, loading && styles.buttonDisabled]}
            onPress={handleAppleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.appleButtonText}>
              {loading ? "Connecting…" : " Continue with Apple"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {loading ? "Connecting…" : "Continue with Google"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Sign in with Apple or Google to continue.
        </Text>
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
  appleButton: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  appleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
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