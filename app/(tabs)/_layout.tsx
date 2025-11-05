import React, { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Keyboard, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FlickTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const activeRoute = state.routes[state.index]?.name;

  if (activeRoute === "record" || keyboardVisible) {
    return null;
  }

  const containerPadding = Math.max(insets.bottom - 4, 12);
  const bottomOffset = Math.max(insets.bottom * 0.35, 6);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: containerPadding, bottom: bottomOffset }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : typeof options.title === "string"
              ? options.title
              : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          if (route.name === "record") {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={typeof label === "string" ? label : undefined}
                accessibilityState={isFocused ? { selected: true } : undefined}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.recordTrigger, isFocused && styles.recordTriggerActive]}
                activeOpacity={0.88}
              >
                <Ionicons
                  name={isFocused ? "radio-button-on" : "radio-button-off"}
                  size={26}
                  color={isFocused ? "#0b0b0b" : "#ffb74d"}
                />
              </TouchableOpacity>
            );
          }

          const iconColor = isFocused ? "#ff9100" : "#f8f1d2";

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={typeof label === "string" ? label : undefined}
              accessibilityState={isFocused ? { selected: true } : undefined}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              {options.tabBarIcon ? (
                options.tabBarIcon({
                  focused: isFocused,
                  color: iconColor,
                  size: 24,
                })
              ) : (
                <Ionicons name="ellipse" size={24} color={iconColor} />
              )}
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label as string}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FlickTabBar {...props} /> }>
      <Tabs.Screen
        name="record"
        options={{
          title: "Record",
          tabBarIcon: ({ color, size }) => <Ionicons name="radio-button-on" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "trending-up" : "trending-up-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "AI Coach",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 18,
    right: 18,
    borderRadius: 999,
    backgroundColor: "rgba(10,10,10,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
    overflow: "hidden",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: "#f8f1d2",
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: "#ffb74d",
  },
  recordTrigger: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1f1f1f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffb74d",
  },
  recordTriggerActive: {
    backgroundColor: "#ffd54f",
    borderColor: "#ffd54f",
  },
});
