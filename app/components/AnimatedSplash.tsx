import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import FlickHandLogo from "./FlickHandLogo";

type Props = {
  visible?: boolean;
};

const BALL_COUNT = 4;

const AnimatedSplash: React.FC<Props> = ({ visible = true }) => {
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    if (visible) {
      loop.start();
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    return () => {
      loop.stop();
    };
  }, [opacity, rotation, visible]);

  useEffect(() => {
    if (!visible) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [opacity, visible]);

  const balls = useMemo(() => new Array(BALL_COUNT).fill(null).map((_, index) => index), []);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity }]}> 
      <LinearGradient colors={["#ff7a00", "#ff9100"]} style={styles.gradient}>
        <View style={styles.circleWrapper}>
          <View style={styles.outerCircle}>
            {balls.map((ball) => {
              const rotate = rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              });
              const phase = rotation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.88 + ball * 0.02, 1.12 - ball * 0.02, 0.88 + ball * 0.02],
              });
              return (
                <Animated.View key={ball} style={[styles.ballContainer, { transform: [{ rotate }] }]}> 
                  <View
                    style={[
                      styles.ballWrapper,
                      {
                        transform: [
                          { rotate: `${(360 / BALL_COUNT) * ball}deg` },
                          { translateY: -92 },
                        ],
                      },
                    ]}
                  >
                    <Animated.View style={[styles.ball, { transform: [{ scale: phase }] }]}> 
                      <Ionicons name="basketball" size={18} color="#111111" />
                    </Animated.View>
                  </View>
                </Animated.View>
              );
            })}
            <View style={styles.logoWrapper}>
              <View style={styles.logoRing}>
                <FlickHandLogo size={110} />
              </View>
              <Text style={styles.title}>Flick</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.04)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  circleWrapper: {
    width: 260,
    height: 260,
    borderRadius: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(0,0,0,0.14)",
    borderWidth: 6,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  ballContainer: {
    position: "absolute",
    left: "50%",
    top: "50%",
  },
  ballWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  ball: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffd54f",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#111",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  logoRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "#fffaf2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#111",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: {
    fontSize: 38,
    color: "#111111",
    fontFamily: "Montserrat-Bold",
    letterSpacing: 2,
  },
});

export default AnimatedSplash;
