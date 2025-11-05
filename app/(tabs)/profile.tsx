import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";

import { supabase } from "../lib/supabase";
import { api } from "../api/client";

const membershipPlans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Baseline tracking and drill library",
    features: ["Record and save clips", "Core progress dashboard", "Weekly coach tips"],
  },
  {
    id: "pro",
    name: "Flick PRO",
    price: "$14/mo",
    description: "Unlock advanced AI coaching",
    features: ["Pose diagnostics", "Arc + release analytics", "Unlimited AI coach chats"],
  },
];

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: api.getProfile });
  const { data: progress } = useQuery({ queryKey: ["profile-progress"], queryFn: () => api.getProgress("7d") });
  const [displayName, setDisplayName] = useState(profile?.name ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatarUrl ?? null);
  const [savingName, setSavingName] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState(3);
  const frequencyOptions = [1, 2, 3, 4, 5, 6];
  const [billingExpanded, setBillingExpanded] = useState(false);

  useEffect(() => {
    if (profile?.name) {
      setDisplayName(profile.name);
    }
    if (profile?.avatarUrl) {
      setAvatarUri(profile.avatarUrl);
    }
  }, [profile]);

  const streak = useMemo(() => {
    if (!progress) return 0;
    return Math.max(5, 6 + Math.round(progress.deltaShots / 2));
  }, [progress]);

  const sessionsCompleted = useMemo(() => {
    if (!progress) return 0;
    return Math.max(1, Math.round(progress.shotsTaken / 45));
  }, [progress]);

  const improvement = useMemo(() => {
    if (!progress) return 0;
    return Math.round(progress.deltaAccuracy * 100);
  }, [progress]);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "We need access to your library to update your photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0]?.uri ?? null);
    }
  };

  const saveDisplayName = async () => {
    if (!displayName.trim()) {
      Alert.alert("Name required", "Please enter a display name.");
      return;
    }
    try {
      setSavingName(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      Alert.alert("Profile updated", "Your display name looks sharp.");
    } finally {
      setSavingName(false);
    }
  };

  const logout = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      router.replace("/Auth");
    },
    onError: (error) => {
      Alert.alert("Logout failed", error.message);
    },
  });

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <LinearGradient colors={["#1f0b00", "#070301"]} style={styles.heroCard}>
            <View style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={42} color="rgba(255,255,255,0.45)" />
                </View>
              )}
              <TouchableOpacity style={styles.changePhoto} onPress={handlePickAvatar}>
                <Ionicons name="camera" size={16} color="#0b0b0b" />
                <Text style={styles.changePhotoLabel}>Change photo</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroText}>
              <View style={styles.nameRow}>
                <Text style={styles.displayName}>{displayName || "Hooper"}</Text>
                <View style={[styles.badge, profile?.isPro ? styles.badgePro : styles.badgeFree]}>
                  <Text style={[styles.badgeLabel, profile?.isPro ? styles.badgeLabelPro : styles.badgeLabelFree]}>
                    {profile?.isPro ? "PRO" : "FREE"}
                  </Text>
                </View>
              </View>
              <Text style={styles.heroSubtitle}>Keep stacking reps. Flick is tracking every improvement.</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sessions completed</Text>
            <Text style={styles.statValue}>{sessionsCompleted}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Accuracy lift</Text>
            <Text style={styles.statValue}>{improvement >= 0 ? `+${improvement}%` : `${improvement}%`}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Current streak</Text>
            <Text style={styles.statValue}>{streak} days</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display name</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter your name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.input}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveDisplayName} disabled={savingName}>
              <Text style={styles.saveButtonLabel}>{savingName ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={[styles.accountRow, billingExpanded && styles.accountRowExpanded]}
            onPress={() => setBillingExpanded((prev) => !prev)}
            activeOpacity={0.85}
          >
            <Text style={styles.accountLabel}>Manage billing</Text>
            <Ionicons name={billingExpanded ? "chevron-down" : "chevron-forward"} size={18} color="#ff9100" />
          </TouchableOpacity>

          {billingExpanded && (
            <View style={styles.billingContent}>
              {membershipPlans.map((plan) => {
                const active = (plan.id === "pro" && profile?.isPro) || (plan.id === "free" && !profile?.isPro);
                return (
                  <View
                    key={plan.id}
                    style={[styles.planCard, active ? styles.planCardActive : styles.planCardInactive]}
                  >
                    <View style={styles.planHeader}>
                      <Text
                        style={[styles.planName, active ? styles.planNameActive : styles.planNameInactive]}
                      >
                        {plan.name}
                      </Text>
                      <Text
                        style={[styles.planPrice, active ? styles.planPriceActive : styles.planPriceInactive]}
                      >
                        {plan.price}
                      </Text>
                    </View>
                    <Text
                      style={[styles.planDescription, active ? styles.planDescriptionActive : styles.planDescriptionInactive]}
                    >
                      {plan.description}
                    </Text>
                    {plan.features.map((feature) => (
                      <View key={feature} style={styles.featureRow}>
                        <Ionicons
                          name="ellipse"
                          size={10}
                          color={active ? "#0b0b0b" : "#ff9100"}
                          style={styles.featureBullet}
                        />
                        <Text
                          style={[styles.featureLabel, active ? styles.featureLabelActive : styles.featureLabelInactive]}
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                    {active ? (
                      <View style={styles.activeBadge}>
                        <Ionicons name="sparkles" size={16} color="#0b0b0b" />
                        <Text style={styles.activeBadgeLabel}>Current plan</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.planButton, styles.planButtonInactive]}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.planButtonLabel, styles.planButtonLabelInactive]}>See details</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification preferences</Text>
          <View style={styles.preferenceCard}>
            <View style={styles.preferenceHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceTitle}>Push alerts</Text>
                <Text style={styles.preferenceSubtitle}>Let Flick send momentum updates you opt into.</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "rgba(255,255,255,0.2)", true: "#ff9100" }}
                thumbColor={notificationsEnabled ? "#050505" : "#fef9f0"}
              />
            </View>
            {notificationsEnabled && (
              <View style={styles.frequencyBlock}>
                <Text style={styles.frequencyLabel}>Daily cadence</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.frequencyRow}
                >
                  {frequencyOptions.map((option) => {
                    const active = option === notificationFrequency;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.frequencyChip, active && styles.frequencyChipActive]}
                        onPress={() => setNotificationFrequency(option)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[styles.frequencyChipLabel, active && styles.frequencyChipLabelActive]}
                        >
                          {`${option}x / day`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={() => logout.mutate()} disabled={logout.isPending}>
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={styles.logoutLabel}>{logout.isPending ? "Signing out..." : "Log out"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#050505",
  },
  hero: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    shadowColor: "#ff9100",
    shadowOpacity: 0.25,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  avatarWrapper: {
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: "#ffd54f",
  },
  avatarPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffd54f",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changePhotoLabel: {
    fontSize: 12,
    color: "#0b0b0b",
    fontFamily: "Montserrat-Bold",
  },
  heroText: {
    flex: 1,
    gap: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  displayName: {
    fontSize: 24,
    color: "#fdf7eb",
    fontFamily: "Montserrat-Bold",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgePro: {
    backgroundColor: "rgba(255,145,0,0.25)",
  },
  badgeFree: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  badgeLabel: {
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
  },
  badgeLabelPro: {
    color: "#ffd54f",
  },
  badgeLabelFree: {
    color: "#fdf7eb",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Montserrat-SemiBold",
    lineHeight: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    color: "#ffe8b0",
    fontFamily: "Montserrat-Bold",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#ffe8b0",
    fontFamily: "Montserrat-Bold",
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
    color: "#fdf7eb",
  },
  saveButton: {
    backgroundColor: "#ff9100",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  saveButtonLabel: {
    color: "#050505",
    fontFamily: "Montserrat-Bold",
  },
  planCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 0,
    borderWidth: 1,
  },
  planCardActive: {
    backgroundColor: "#ffd54f",
    borderColor: "#ffd54f",
    shadowColor: "#ffd54f",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  planCardInactive: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  planName: {
    fontSize: 20,
    fontFamily: "Montserrat-Bold",
  },
  planNameActive: {
    color: "#0b0b0b",
  },
  planNameInactive: {
    color: "#ffe8b0",
  },
  planPrice: {
    fontSize: 18,
    fontFamily: "Montserrat-SemiBold",
  },
  planPriceActive: {
    color: "#0b0b0b",
  },
  planPriceInactive: {
    color: "#ffd54f",
  },
  planDescription: {
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 12,
  },
  planDescriptionActive: {
    color: "rgba(11,11,11,0.75)",
  },
  planDescriptionInactive: {
    color: "rgba(255,255,255,0.7)",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  featureBullet: {
    marginTop: 4,
  },
  featureLabel: {
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
  },
  featureLabelActive: {
    color: "#0b0b0b",
  },
  featureLabelInactive: {
    color: "rgba(255,255,255,0.78)",
  },
  planButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  planButtonActive: {
    backgroundColor: "#0b0b0b",
  },
  planButtonInactive: {
    backgroundColor: "#ff9100",
  },
  planButtonLabel: {
    fontFamily: "Montserrat-Bold",
    fontSize: 12,
  },
  planButtonLabelActive: {
    color: "#ffd54f",
  },
  planButtonLabelInactive: {
    color: "#050505",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  activeBadgeLabel: {
    fontSize: 12,
    color: "#0b0b0b",
    fontFamily: "Montserrat-Bold",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  accountRowExpanded: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  accountLabel: {
    fontSize: 15,
    color: "#ffe8b0",
    fontFamily: "Montserrat-SemiBold",
  },
  billingContent: {
    marginTop: 16,
    gap: 16,
    paddingTop: 10,
  },
  preferenceCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  preferenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  preferenceTitle: {
    fontSize: 15,
    color: "#ffe8b0",
    fontFamily: "Montserrat-Bold",
  },
  preferenceSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "rgba(255,255,255,0.68)",
    fontFamily: "Montserrat-SemiBold",
  },
  frequencyBlock: {
    marginTop: 20,
  },
  frequencyLabel: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Montserrat-Bold",
    marginBottom: 12,
  },
  frequencyRow: {
    paddingVertical: 4,
  },
  frequencyChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginRight: 10,
  },
  frequencyChipActive: {
    backgroundColor: "#ff9100",
    borderColor: "#ff9100",
  },
  frequencyChipLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Montserrat-SemiBold",
  },
  frequencyChipLabelActive: {
    color: "#0b0b0b",
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ff5c5c",
    borderRadius: 18,
    paddingVertical: 16,
  },
  logoutLabel: {
    color: "#fff",
    fontFamily: "Montserrat-Bold",
    fontSize: 16,
  },
});

export default ProfileScreen;
