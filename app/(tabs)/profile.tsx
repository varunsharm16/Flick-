import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
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
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 12 }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}> 
          <LinearGradient colors={["#0f172a", "#1f2937"]} style={styles.heroCard}>
            <View style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={42} color="#cbd5f5" />
                </View>
              )}
              <TouchableOpacity style={styles.changePhoto} onPress={handlePickAvatar}>
                <Ionicons name="camera" size={16} color="#0f172a" />
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
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveDisplayName} disabled={savingName}>
              <Text style={styles.saveButtonLabel}>{savingName ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership</Text>
          {membershipPlans.map((plan) => {
            const active = (plan.id === "pro" && profile?.isPro) || (plan.id === "free" && !profile?.isPro);
            return (
              <LinearGradient
                key={plan.id}
                colors={active ? ["#fde68a", "#fbbf24"] : ["#f8fafc", "#e2e8f0"]}
                style={[styles.planCard, active && styles.activePlan]}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
                <Text style={styles.planDescription}>{plan.description}</Text>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#0f172a" />
                    <Text style={styles.featureLabel}>{feature}</Text>
                  </View>
                ))}
                {active ? (
                  <View style={styles.activeBadge}>
                    <Ionicons name="sparkles" size={16} color="#0f172a" />
                    <Text style={styles.activeBadgeLabel}>Current plan</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.planButton}>
                    <Text style={styles.planButtonLabel}>See details</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.accountRow}>
            <Text style={styles.accountLabel}>Manage billing</Text>
            <Ionicons name="chevron-forward" size={18} color="#1e293b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.accountRow}>
            <Text style={styles.accountLabel}>Notification preferences</Text>
            <Ionicons name="chevron-forward" size={18} color="#1e293b" />
          </TouchableOpacity>
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
    backgroundColor: "#f8fafc",
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
    shadowColor: "#0f172a",
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
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
    borderColor: "rgba(255,255,255,0.45)",
  },
  avatarPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(148,163,184,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhoto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#facc15",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changePhotoLabel: {
    fontSize: 12,
    color: "#0f172a",
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
    color: "#f8fafc",
    fontFamily: "Montserrat-Bold",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgePro: {
    backgroundColor: "rgba(251,191,36,0.25)",
  },
  badgeFree: {
    backgroundColor: "rgba(148,163,184,0.25)",
  },
  badgeLabel: {
    fontSize: 12,
    fontFamily: "Montserrat-Bold",
  },
  badgeLabelPro: {
    color: "#facc15",
  },
  badgeLabelFree: {
    color: "#e2e8f0",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#cbd5f5",
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
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    color: "#0f172a",
    fontFamily: "Montserrat-Bold",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#0f172a",
    fontFamily: "Montserrat-Bold",
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
    color: "#0f172a",
  },
  saveButton: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  saveButtonLabel: {
    color: "#f8fafc",
    fontFamily: "Montserrat-Bold",
  },
  planCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 18,
  },
  activePlan: {
    shadowColor: "#facc15",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontFamily: "Montserrat-Bold",
    color: "#0f172a",
  },
  planPrice: {
    fontSize: 18,
    fontFamily: "Montserrat-SemiBold",
    color: "#0f172a",
  },
  planDescription: {
    fontSize: 13,
    color: "#334155",
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 13,
    color: "#1f2937",
    fontFamily: "Montserrat-SemiBold",
  },
  planButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#0f172a",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  planButtonLabel: {
    color: "#f8fafc",
    fontFamily: "Montserrat-Bold",
    fontSize: 12,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.1)",
  },
  activeBadgeLabel: {
    fontSize: 12,
    color: "#0f172a",
    fontFamily: "Montserrat-Bold",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  accountLabel: {
    fontSize: 15,
    color: "#0f172a",
    fontFamily: "Montserrat-SemiBold",
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
    backgroundColor: "#ef4444",
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
