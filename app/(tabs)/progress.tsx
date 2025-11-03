import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine } from "victory-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";

const RANGE_OPTIONS = ["7D", "30D", "90D", "All"] as const;

type RangeOption = (typeof RANGE_OPTIONS)[number];

type Widget = {
  id: string;
  title: string;
  value: string;
  change: string;
  changePositive?: boolean;
  summary: string;
  description: string;
  trend: { x: string; y: number }[];
  badge?: "PRO" | "CORE";
};

const formatDelta = (value: number, unit = "%") => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${Math.round(value * 100)}${unit}`;
};

const ProgressScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<RangeOption>("7D");
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);

  const { data: progress } = useQuery({
    queryKey: ["progress", range],
    queryFn: () => api.getProgress(range.toLowerCase()),
  });

  const highlightStats = useMemo(() => {
    if (!progress) {
      return [
        { label: "Average accuracy", value: "--" },
        { label: "Shot consistency", value: "--" },
        { label: "Sessions this week", value: "--" },
      ];
    }
    return [
      { label: "Average accuracy", value: `${Math.round(progress.shootingAccuracy * 100)}%` },
      { label: "Shot consistency", value: `${Math.round(progress.formConsistency * 100)}%` },
      { label: "Sessions this week", value: `${progress.shotsTaken > 0 ? Math.max(1, Math.round(progress.shotsTaken / 60)) : 0}` },
    ];
  }, [progress]);

  const chartData = useMemo(() => {
    return (
      progress?.accuracyTrend?.map((point, index) => ({
        x: point.day ?? `D${index + 1}`,
        y: Math.round((point.v ?? 0) * 100),
      })) ?? []
    );
  }, [progress]);

  const widgets = useMemo<Widget[]>(() => {
    if (!progress) return [];
    return [
      {
        id: "shootingAccuracy",
        title: "Shooting Accuracy",
        value: `${Math.round(progress.shootingAccuracy * 100)}%`,
        change: formatDelta(progress.deltaAccuracy),
        changePositive: progress.deltaAccuracy >= 0,
        summary: "Your release timing has tightened up over the last few sessions. Keep stacking confident reps.",
        description:
          "Accuracy captures makes vs. attempts. The AI models each release and identifies mechanical drift before it impacts results.",
        trend: chartData,
        badge: "CORE",
      },
      {
        id: "formConsistency",
        title: "Form Consistency",
        value: `${Math.round(progress.formConsistency * 100)}%`,
        change: formatDelta(progress.deltaForm),
        changePositive: progress.deltaForm >= 0,
        summary: "Your set point and follow-through are syncing. Variability dropped by 3% this week.",
        description:
          "Consistency blends elbow alignment, wrist angle, and release height into one score. The closer to 100%, the more repeatable your shot.",
        trend: chartData,
        badge: "CORE",
      },
      {
        id: "shotsTaken",
        title: "Shots Taken",
        value: `${progress.shotsTaken}`,
        change: `+${progress.deltaShots}`,
        changePositive: progress.deltaShots >= 0,
        summary: "Volume drives mastery. You're trending up and adding quality reps every session.",
        description:
          "Shots taken tallies logged attempts across drills. Pair it with accuracy for a complete picture of workload and efficiency.",
        trend: chartData,
      },
      {
        id: "releaseTime",
        title: "Release Time",
        value: `${progress.releaseTime.toFixed(2)}s`,
        change: `${progress.deltaRelease > 0 ? "+" : ""}${progress.deltaRelease.toFixed(2)}s`,
        changePositive: progress.deltaRelease <= 0,
        summary: "The ball is leaving your hand quicker without sacrificing balance. That's elite guard behavior.",
        description:
          "Release time measures catch-to-release speed. Flick flags hesitations, so you can train a lightning-fast motion.",
        trend: chartData,
        badge: "PRO",
      },
      {
        id: "followThrough",
        title: "Follow Through",
        value: `${Math.round(progress.followThrough * 100)}%`,
        change: formatDelta(progress.deltaFollow),
        changePositive: progress.deltaFollow >= 0,
        summary: "Hold that pose! A stronger wrist snap is giving you the soft rotation coaches love.",
        description:
          "Follow through looks at wrist extension, finger spread, and hold time. It's the finishing touch for a buttery jumper.",
        trend: chartData,
        badge: "PRO",
      },
      {
        id: "arcAngle",
        title: "Arc Angle",
        value: `${progress.arcAngle}°`,
        change: progress.arcNote ?? "Optimal",
        changePositive: true,
        summary: "You're keeping the ball in the 45° sweet spot. Defenders hate it, nets love it.",
        description:
          "Arc angle is tracked frame-by-frame to confirm the ball stays in the ideal launch window. We'll nudge you when it flattens.",
        trend: chartData,
        badge: "PRO",
      },
    ];
  }, [progress, chartData]);

  const streakValue = useMemo(() => {
    const base = progress ? Math.min(30, 5 + Math.round(progress.deltaShots / 2)) : 0;
    return Math.max(base, progress ? 5 : 0);
  }, [progress]);

  const handleOpenWidget = (widget: Widget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWidget(widget);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 12 }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140, paddingHorizontal: 20 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Shooting Progress</Text>
            <Text style={styles.subtitle}>Dial in the range that tells your story.</Text>
          </View>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={18} color="#0f172a" />
            <Text style={styles.shareLabel}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rangeRow}>
          {RANGE_OPTIONS.map((option) => {
            const active = option === range;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.rangeChip, active && styles.rangeChipActive]}
                onPress={() => setRange(option)}
              >
                <Text style={[styles.rangeLabel, active && styles.rangeLabelActive]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <LinearGradient colors={["#0f172a", "#052e16"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Accuracy trend</Text>
              <Text style={styles.chartSubtitle}>Green means you\'re in rhythm.</Text>
            </View>
            <View style={styles.accuracyBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#bbf7d0" />
              <Text style={styles.accuracyBadgeLabel}>
                {progress ? `${Math.round(progress.shootingAccuracy * 100)}%` : "--"}
              </Text>
            </View>
          </View>
          <VictoryChart
            height={220}
            padding={{ left: 36, right: 24, top: 16, bottom: 36 }}
            domainPadding={{ y: [20, 20], x: [12, 12] }}
          >
            <VictoryAxis
              style={{
                axis: { stroke: "rgba(226,232,240,0.2)" },
                tickLabels: { fill: "rgba(226,232,240,0.6)", fontFamily: "Montserrat-SemiBold", fontSize: 10 },
                grid: { stroke: "rgba(15,118,110,0.2)", strokeDasharray: "4" },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(val) => `${val}%`}
              style={{
                axis: { stroke: "transparent" },
                tickLabels: { fill: "rgba(226,232,240,0.7)", fontFamily: "Montserrat-SemiBold", fontSize: 10 },
                grid: { stroke: "rgba(16,185,129,0.15)" },
              }}
            />
            <VictoryArea
              data={chartData}
              interpolation="natural"
              style={{
                data: { fill: "rgba(16,185,129,0.12)", strokeWidth: 0 },
              }}
            />
            <VictoryLine
              data={chartData}
              interpolation="natural"
              style={{
                data: { stroke: "#34d399", strokeWidth: 3 },
              }}
            />
          </VictoryChart>
        </LinearGradient>

        <View style={styles.highlightRow}>
          {highlightStats.map((item) => (
            <LinearGradient key={item.label} colors={["#ffffff", "#f1f5f9"]} style={styles.highlightCard}>
              <Text style={styles.highlightLabel}>{item.label}</Text>
              <Text style={styles.highlightValue}>{item.value}</Text>
            </LinearGradient>
          ))}
        </View>

        <View style={styles.streakCard}>
          <LinearGradient colors={["#fff1f2", "#ffe4e6"]} style={styles.streakInner}>
            <View>
              <Text style={styles.streakLabel}>Day streak</Text>
              <Text style={styles.streakValue}>{streakValue} days</Text>
            </View>
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={28} color="#fb7185" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.widgetGrid}>
          {widgets.map((widget) => (
            <TouchableOpacity
              key={widget.id}
              style={styles.widgetCard}
              onLongPress={() => handleOpenWidget(widget)}
              delayLongPress={120}
            >
              <View style={styles.widgetHeader}>
                <Text style={styles.widgetTitle}>{widget.title}</Text>
                {widget.badge && (
                  <View style={styles.widgetBadge}>
                    <Text style={styles.widgetBadgeText}>{widget.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.widgetValue}>{widget.value}</Text>
              <Text
                style={[styles.widgetChange, widget.changePositive ? styles.widgetPositive : styles.widgetNegative]}
              >
                {widget.change}
              </Text>
              <Text style={styles.widgetHint}>Long press to expand</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selectedWidget} animationType="slide" onRequestClose={() => setSelectedWidget(null)}>
        <SafeAreaView style={[styles.modalSafe, { paddingTop: insets.top + 16 }]} edges={['top']}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedWidget(null)}>
                <Ionicons name="chevron-back" size={22} color="#0f172a" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedWidget?.title}</Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.modalValueRow}>
              <Text style={styles.modalValue}>{selectedWidget?.value}</Text>
              <Text
                style={[
                  styles.modalChange,
                  selectedWidget?.changePositive ? styles.widgetPositive : styles.widgetNegative,
                ]}
              >
                {selectedWidget?.change}
              </Text>
            </View>

            <LinearGradient colors={["#0f172a", "#1e293b"]} style={styles.modalChart}>
              <VictoryChart height={260} padding={{ left: 48, right: 28, top: 24, bottom: 48 }} domainPadding={12}>
                <VictoryAxis
                  style={{
                    axis: { stroke: "rgba(226,232,240,0.1)" },
                    tickLabels: { fill: "rgba(226,232,240,0.7)", fontFamily: "Montserrat-SemiBold", fontSize: 10 },
                    grid: { stroke: "rgba(148,163,184,0.2)", strokeDasharray: "6" },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  style={{
                    axis: { stroke: "transparent" },
                    tickLabels: { fill: "rgba(226,232,240,0.7)", fontFamily: "Montserrat-SemiBold", fontSize: 10 },
                    grid: { stroke: "rgba(59,130,246,0.2)" },
                  }}
                />
                <VictoryArea
                  data={selectedWidget?.trend ?? []}
                  interpolation="catmullRom"
                  style={{ data: { fill: "rgba(59,130,246,0.18)", strokeWidth: 0 } }}
                />
                <VictoryLine
                  data={selectedWidget?.trend ?? []}
                  interpolation="catmullRom"
                  style={{ data: { stroke: "#60a5fa", strokeWidth: 3 } }}
                />
              </VictoryChart>
            </LinearGradient>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>What changed</Text>
              <Text style={styles.modalBody}>{selectedWidget?.summary}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Why it matters</Text>
              <Text style={styles.modalBody}>{selectedWidget?.description}</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: "Montserrat-Bold",
    color: "#0f172a",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
    marginTop: 6,
    fontFamily: "Montserrat-SemiBold",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  shareLabel: {
    fontSize: 12,
    color: "#0f172a",
    fontFamily: "Montserrat-SemiBold",
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
  },
  rangeChipActive: {
    backgroundColor: "#0f172a",
  },
  rangeLabel: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.3,
  },
  rangeLabelActive: {
    color: "#f8fafc",
  },
  chartCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#0f172a",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 18,
    color: "#bbf7d0",
    fontFamily: "Montserrat-SemiBold",
  },
  chartSubtitle: {
    fontSize: 13,
    color: "#94f3c8",
    marginTop: 2,
    fontFamily: "Montserrat-SemiBold",
  },
  accuracyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15,118,110,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  accuracyBadgeLabel: {
    color: "#f8fafc",
    fontSize: 14,
    fontFamily: "Montserrat-Bold",
  },
  highlightRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    flexWrap: "wrap",
  },
  highlightCard: {
    flexBasis: "31%",
    padding: 18,
    borderRadius: 20,
    marginBottom: 12,
    minWidth: 140,
  },
  highlightLabel: {
    fontSize: 13,
    color: "#475569",
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 10,
  },
  highlightValue: {
    fontSize: 22,
    color: "#0f172a",
    fontFamily: "Montserrat-Bold",
  },
  streakCard: {
    marginTop: 10,
  },
  streakInner: {
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  streakLabel: {
    fontSize: 14,
    color: "#881337",
    fontFamily: "Montserrat-SemiBold",
  },
  streakValue: {
    fontSize: 24,
    color: "#be123c",
    fontFamily: "Montserrat-Bold",
  },
  streakIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(244,63,94,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  widgetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 28,
    marginBottom: 12,
  },
  widgetCard: {
    flexBasis: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  widgetTitle: {
    fontSize: 14,
    color: "#0f172a",
    fontFamily: "Montserrat-SemiBold",
  },
  widgetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fee2e2",
  },
  widgetBadgeText: {
    fontSize: 10,
    color: "#be123c",
    fontFamily: "Montserrat-Bold",
  },
  widgetValue: {
    marginTop: 18,
    fontSize: 26,
    color: "#0f172a",
    fontFamily: "Montserrat-Bold",
  },
  widgetChange: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
  },
  widgetPositive: {
    color: "#047857",
  },
  widgetNegative: {
    color: "#be123c",
  },
  widgetHint: {
    marginTop: 14,
    fontSize: 11,
    color: "#94a3b8",
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.3,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    color: "#0f172a",
    fontFamily: "Montserrat-Bold",
  },
  modalValueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
  },
  modalValue: {
    fontSize: 48,
    fontFamily: "Montserrat-Bold",
    color: "#0f172a",
  },
  modalChange: {
    fontSize: 20,
    fontFamily: "Montserrat-SemiBold",
  },
  modalChart: {
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 12,
    marginBottom: 24,
  },
  modalSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
    color: "#0f172a",
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "#475569",
    fontFamily: "Montserrat-SemiBold",
  },
});

export default ProgressScreen;
