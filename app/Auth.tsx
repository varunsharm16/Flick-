import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const hasNavigatedRef = useRef(false);
  const processedRedirectUrlsRef = useRef<Set<string>>(new Set());
  const isAuthExchangeInProgress = useRef(false);

  const waitForActiveExchange = useCallback(async () => {
    const maxWaitTimeMs = 5000;
    const intervalMs = 150;
    let elapsed = 0;

    while (isAuthExchangeInProgress.current && elapsed < maxWaitTimeMs) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      elapsed += intervalMs;
    }
  }, []);

  const beginSessionExchange = useCallback(() => {
    if (!isAuthExchangeInProgress.current) {
      isAuthExchangeInProgress.current = true;
      console.log("🔄 Starting session exchange...");
    }
  }, []);

  const navigateToProfile = useCallback(() => {
    if (hasNavigatedRef.current) {
      return;
    }

    if (isAuthExchangeInProgress.current) {
      isAuthExchangeInProgress.current = false;
      console.log("✅ Exchange complete, session established.");
    }

    hasNavigatedRef.current = true;
    router.replace("/(tabs)/profile");
  }, [router]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setLoading(false);
        navigateToProfile();
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [navigateToProfile]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          navigateToProfile();
        }
      } catch (sessionError) {
        console.warn("Failed to restore session", sessionError);
      }
    };

    restoreSession();
  }, [navigateToProfile]);

  const showError = useCallback((message: string) => {
    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert("Authentication Error", message);
    }
  }, []);

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

  const finalizeAuthentication = useCallback(
    async (
      authParams: Record<string, string>,
      options?: { allowActiveExchange?: boolean }
    ) => {
      if (authParams.error) {
        throw new Error(authParams.error_description ?? authParams.error ?? "Authentication failed");
      }

      if (isAuthExchangeInProgress.current && !options?.allowActiveExchange) {
        await waitForActiveExchange();
        return;
      }

      if (!isAuthExchangeInProgress.current) {
        beginSessionExchange();
      }

      if (authParams.access_token && authParams.refresh_token) {
        const wasExchangeActive = isAuthExchangeInProgress.current;
        let callSucceeded = false;
        try {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: authParams.access_token,
            refresh_token: authParams.refresh_token,
          });

          if (sessionError) {
            throw sessionError;
          }

          callSucceeded = true;
        } finally {
          const shouldRestore =
            callSucceeded && wasExchangeActive && isAuthExchangeInProgress.current;
          isAuthExchangeInProgress.current = false;
          if (shouldRestore) {
            isAuthExchangeInProgress.current = true;
          }
        }
      } else if (authParams.code) {
        const wasExchangeActive = isAuthExchangeInProgress.current;
        let callSucceeded = false;
        try {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession({
            authCode: authParams.code,
          });

          if (sessionError) {
            throw sessionError;
          }

          callSucceeded = true;
        } finally {
          const shouldRestore =
            callSucceeded && wasExchangeActive && isAuthExchangeInProgress.current;
          isAuthExchangeInProgress.current = false;
          if (shouldRestore) {
            isAuthExchangeInProgress.current = true;
          }
        }
      } else if (Object.keys(authParams).length > 0) {
        isAuthExchangeInProgress.current = false;
        throw new Error("No authentication response received. Please try again.");
      }

      if (Object.keys(authParams).length > 0) {
        const wasExchangeActive = isAuthExchangeInProgress.current;
        let callSucceeded = false;
        try {
          const { data: sessionResult, error: sessionLookupError } = await supabase.auth.getSession();

          if (sessionLookupError) {
            throw sessionLookupError;
          }

          if (!sessionResult.session) {
            throw new Error("We couldn't finish signing you in. Please try again.");
          }

          callSucceeded = true;
        } finally {
          const shouldRestore =
            callSucceeded && wasExchangeActive && isAuthExchangeInProgress.current;
          isAuthExchangeInProgress.current = false;
          if (shouldRestore) {
            isAuthExchangeInProgress.current = true;
          }
        }
      }
    },
    [beginSessionExchange, waitForActiveExchange]
  );

  const handleAuthRedirect = useCallback(
    async (url: string | null | undefined) => {
      if (!url) {
        return;
      }

      const authParams = parseAuthParams(url);

      if (Object.keys(authParams).length === 0) {
        return;
      }

      if (processedRedirectUrlsRef.current.has(url)) {
        try {
          const wasExchangeActive = isAuthExchangeInProgress.current;
          let callSucceeded = false;
          try {
            const { data: existingSession, error: existingSessionError } =
              await supabase.auth.getSession();

            if (existingSessionError) {
              throw existingSessionError;
            }

            callSucceeded = true;

            if (existingSession.session) {
              navigateToProfile();
            }
          } finally {
            const shouldRestore =
              callSucceeded && wasExchangeActive && isAuthExchangeInProgress.current;
            isAuthExchangeInProgress.current = false;
            if (shouldRestore) {
              isAuthExchangeInProgress.current = true;
            }
          }
        } catch (sessionCheckError) {
          console.warn("Failed to confirm existing session after redirect", sessionCheckError);
        }

        return;
      }

      processedRedirectUrlsRef.current.add(url);

      try {
        const wasExchangeActive = isAuthExchangeInProgress.current;
        let callSucceeded = false;
        try {
          const { data: existingSession, error: existingSessionError } =
            await supabase.auth.getSession();

          if (existingSessionError) {
            throw existingSessionError;
          }

          callSucceeded = true;

          if (existingSession.session) {
            navigateToProfile();
            return;
          }
        } finally {
          const shouldRestore =
            callSucceeded && wasExchangeActive && isAuthExchangeInProgress.current;
          isAuthExchangeInProgress.current = false;
          if (shouldRestore) {
            isAuthExchangeInProgress.current = true;
          }
        }
      } catch (sessionCheckError) {
        console.warn("Failed to check session before finalizing redirect", sessionCheckError);
      }

      if (isAuthExchangeInProgress.current) {
        await waitForActiveExchange();
        try {
          const wasExchangeActive = isAuthExchangeInProgress.current;
          let callSucceeded = false;
          try {
            const { data: existingSession } = await supabase.auth.getSession();
            callSucceeded = true;
            if (existingSession?.session) {
              navigateToProfile();
            }
          } finally {
            const shouldRestore =
              callSucceeded && wasExchangeActive && isAuthExchangeInProgress.current;
            isAuthExchangeInProgress.current = false;
            if (shouldRestore) {
              isAuthExchangeInProgress.current = true;
            }
          }
        } catch (sessionCheckError) {
          console.warn("Failed to confirm session after waiting for exchange", sessionCheckError);
        }
        return;
      }

      beginSessionExchange();

      try {
        setLoading(true);
        await finalizeAuthentication(authParams, { allowActiveExchange: true });
        navigateToProfile();
      } catch (error: any) {
        processedRedirectUrlsRef.current.delete(url);
        console.error("Failed to finalize authentication from redirect", error);
        showError(error?.message ?? "Unable to complete authentication. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [
      beginSessionExchange,
      finalizeAuthentication,
      navigateToProfile,
      showError,
      waitForActiveExchange,
    ]
  );

  useEffect(() => {
    const subscription = Linking.addEventListener("url", (event) => {
      handleAuthRedirect(event?.url);
    });

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (initialUrl) {
          handleAuthRedirect(initialUrl);
        }
      })
      .catch((linkError) => {
        console.warn("Failed to retrieve initial URL", linkError);
      });

    return () => {
      subscription.remove();
    };
  }, [handleAuthRedirect]);

  const handleGoogleSignIn = async () => {
    let processedResultUrl: string | undefined;

    try {
      setLoading(true);

      if (isAuthExchangeInProgress.current) {
        await waitForActiveExchange();
        try {
          const { data: existingSession } = await supabase.auth.getSession();
          if (existingSession?.session) {
            navigateToProfile();
          }
        } catch (sessionCheckError) {
          console.warn("Failed to confirm session after waiting for exchange", sessionCheckError);
        }
        return;
      }

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

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

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

      const authParams = parseAuthParams(result.url);

      if (Object.keys(authParams).length === 0) {
        throw new Error("No authentication response received. Please try again.");
      }

      if (result.url) {
        const wasProcessed = processedRedirectUrlsRef.current.has(result.url);

        if (wasProcessed) {
          const { data: existingSession, error: existingSessionError } = await supabase.auth.getSession();

          if (existingSessionError) {
            throw existingSessionError;
          }

          if (existingSession.session) {
            navigateToProfile();
            return;
          }
        } else {
          processedRedirectUrlsRef.current.add(result.url);
          processedResultUrl = result.url;
        }
      }

      beginSessionExchange();

      await finalizeAuthentication(authParams, { allowActiveExchange: true });

      navigateToProfile();
    } catch (error: any) {
      if (processedResultUrl) {
        processedRedirectUrlsRef.current.delete(processedResultUrl);
      }
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
