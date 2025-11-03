import React, { useEffect, useMemo, useRef, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Platform, Text, TextInput, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

import AnimatedSplash from "./components/AnimatedSplash";

const queryClient = new QueryClient();

const montserratSources: Record<string, Font.FontSource> = {
  "Montserrat-SemiBold": {
    uri: "https://raw.githubusercontent.com/expo/google-fonts/main/fonts/montserrat/Montserrat_600SemiBold.ttf",
    display: Font.FontDisplay.FALLBACK,
  },
  "Montserrat-Bold": {
    uri: "https://raw.githubusercontent.com/expo/google-fonts/main/fonts/montserrat/Montserrat_700Bold.ttf",
    display: Font.FontDisplay.FALLBACK,
  },
};

SplashScreen.preventAutoHideAsync().catch(() => {
  // no-op if splash screen was already hidden
});

export default function Layout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const didSetDefaults = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Font.loadAsync(montserratSources);
        if (mounted) {
          setFontsLoaded(true);
        }
      } catch (error) {
        console.warn("Failed to load fonts", error);
        if (mounted) {
          setFontsLoaded(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!fontsLoaded || didSetDefaults.current) {
      return;
    }

    const baseTextStyle = { fontFamily: "Montserrat-SemiBold", color: "#fdf7eb" };
    Text.defaultProps = Text.defaultProps ?? {};
    Text.defaultProps.allowFontScaling = Text.defaultProps.allowFontScaling ?? true;
    Text.defaultProps.style = Text.defaultProps.style
      ? [baseTextStyle, Text.defaultProps.style]
      : baseTextStyle;

    TextInput.defaultProps = TextInput.defaultProps ?? {};
    TextInput.defaultProps.style = TextInput.defaultProps.style
      ? [baseTextStyle, TextInput.defaultProps.style]
      : baseTextStyle;

    didSetDefaults.current = true;

    const timeout = setTimeout(() => {
      setShowSplash(false);
      SplashScreen.hideAsync().catch(() => {});
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [fontsLoaded]);

  const content = useMemo(
    () => (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="Auth" />
        <Stack.Screen name="ResetPassword" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    ),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={Platform.OS === "ios" ? "light" : "light"} />
      <View style={{ flex: 1, backgroundColor: "#0b0b0b" }}>
        {content}
        {showSplash && <AnimatedSplash visible />}
      </View>
    </QueryClientProvider>
  );
}
