import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FlickTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}> 
      <LinearGradient
        colors={["#ffffff", "#f7f8fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tabBar}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
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
              <View key={route.key} style={styles.recordWrapper}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={typeof label === "string" ? label : undefined}
                  accessibilityState={isFocused ? { selected: true } : undefined}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={isFocused ? ["#fe646f", "#f9464f"] : ["#111827", "#111827"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.recordButton, isFocused && styles.recordButtonFocused]}
                  >
                    <View style={styles.plusOuter}>
                      <Ionicons
                        name="add"
                        size={30}
                        color={isFocused ? "#fff" : "#fe646f"}
                        style={styles.plusIcon}
                      />
                    </View>
                  </LinearGradient>
                  <Text style={[styles.recordLabel, isFocused && styles.recordLabelActive]}>Record</Text>
                </TouchableOpacity>
              </View>
            );
          }

          const color = isFocused ? "#111827" : "#9ca3af";

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={typeof label === "string" ? label : undefined}
              accessibilityState={isFocused ? { selected: true } : undefined}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {options.tabBarIcon ? (
                options.tabBarIcon({
                  focused: isFocused,
                  color,
                  size: 24,
                })
              ) : (
                <Ionicons name="ellipse" size={24} color={color} />
              )}
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label as string}</Text>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FlickTabBar {...props} /> }>
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
        name="record"
        options={{
          title: "Record",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add" size={size} color={color} />
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
    left: 16,
    right: 16,
    bottom: Platform.select({ ios: 20, android: 16, default: 16 }),
    borderRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    color: "#9ca3af",
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: "#111827",
  },
  recordWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderWidth: 4,
    borderColor: "#f4f4f5",
  },
  recordButtonFocused: {
    borderColor: "#fbcfe8",
  },
  plusOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    marginLeft: 1,
  },
  recordLabel: {
    marginTop: 8,
    fontSize: 12,
    letterSpacing: 0.2,
    color: "#6b7280",
    textAlign: "center",
    fontFamily: "Montserrat-SemiBold",
  },
  recordLabelActive: {
    color: "#111827",
  },
});
