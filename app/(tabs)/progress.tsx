import React, { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LineChart } from "react-native-gifted-charts";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";

const RANGE_OPTIONS = ["7D", "30D", "90D", "All"] as const;

type RangeOption = (typeof RANGE_OPTIONS)[number];

type TrendPoint = {
  label: string;
  value: number;
};

const FALLBACK_TREND: TrendPoint[] = [
  { label: "D1", value: 60 },
  { label: "D2", value: 62 },
  { label: "D3", value: 64 },
  { label: "D4", value: 63 },
  { label: "D5", value: 65 },
  { label: "D6", value: 66 },
  { label: "D7", value: 67 },
];

const RANGE_DAY_SPAN: Record<RangeOption, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
  All: 150,
};

const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const dayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

const buildXAxisLabels = (range: RangeOption, total: number) => {
  if (total <= 0) return [];
  const span = RANGE_DAY_SPAN[range] ?? 30;
  const step = Math.max(1, Math.round(span / Math.max(total - 1, 1)));
  const labels: string[] = [];

  for (let index = 0; index < total; index += 1) {
    const daysAgo = step * (total - 1 - index);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    if (range === "7D") {
      labels.push(weekdayFormatter.format(date));
    } else if (range === "30D" || range === "90D") {
      labels.push(dayFormatter.format(date));
    } else {
      labels.push(monthFormatter.format(date));
    }
  }

  return labels;
};

type Widget = {
  id: string;
  title: string;
  value: string;
  change: string;
  changePositive?: boolean;
  summary: string;
  description: string;
  trend: TrendPoint[];
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

  const { width } = useWindowDimensions();
  const horizontalPadding = useMemo(() => Math.max(16, Math.min(28, width * 0.06)), [width]);

  const rawTrend = useMemo<TrendPoint[]>(() => {
    if (progress?.accuracyTrend?.length) {
      return progress.accuracyTrend.map((point, index) => ({
        label: point.day ?? `D${index + 1}`,
        value: Math.round((point.v ?? 0) * 100),
      }));
    }
    return FALLBACK_TREND;
  }, [progress]);

  const chartLabels = useMemo(() => buildXAxisLabels(range, rawTrend.length), [range, rawTrend.length]);

  const chartData = useMemo<TrendPoint[]>(() => {
    if (!rawTrend.length) return [];
    return rawTrend.map((point, index) => ({
      label: chartLabels[index] ?? point.label,
      value: point.value,
    }));
  }, [chartLabels, rawTrend]);

  const resolvedChartData = chartData;

  const chartSpacing = useMemo(() => {
    if (chartData.length <= 6) return 42;
    if (chartData.length <= 10) return 28;
    if (chartData.length <= 18) return 20;
    return 14;
  }, [chartData.length]);

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
        trend: resolvedChartData,
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
        trend: resolvedChartData,
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
        trend: resolvedChartData,
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
        trend: resolvedChartData,
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
        trend: resolvedChartData,
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
        trend: resolvedChartData,
        badge: "PRO",
      },
    ];
  }, [progress, resolvedChartData]);

  const streakValue = useMemo(() => {
    const base = progress ? Math.min(30, 5 + Math.round(progress.deltaShots / 2)) : 0;
    return Math.max(base, progress ? 5 : 0);
  }, [progress]);

  const handleOpenWidget = (widget: Widget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWidget(widget);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 16 }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 140, paddingHorizontal: horizontalPadding }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Shooting Progress</Text>
          <Text style={styles.subtitle}>Dial in the range that tells your story.</Text>
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

        <LinearGradient colors={["#201000", "#0f0600"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Accuracy trend</Text>
              <Text style={styles.chartSubtitle}>Watch the arc adjust with your range.</Text>
            </View>
            <View style={styles.accuracyBadge}>
              <Ionicons name="sparkles" size={18} color="#0b0b0b" />
              <Text style={styles.accuracyBadgeLabel}>
                {progress ? `${Math.round(progress.shootingAccuracy * 100)}%` : "--"}
              </Text>
            </View>
          </View>
          <View style={styles.chartWrapper}>
            <LineChart
              data={resolvedChartData.map((point) => ({ label: point.label, value: point.value }))}
              curved
              areaChart
              height={200}
              thickness={3}
              spacing={chartSpacing}
              initialSpacing={chartSpacing}
              color="#ffb74d"
              startFillColor="#ffb74d"
              endFillColor="#ff9100"
              startOpacity={0.24}
              endOpacity={0.08}
              yAxisColor="rgba(255,255,255,0.12)"
              xAxisColor="rgba(255,255,255,0.12)"
              yAxisTextStyle={{ color: "rgba(255,255,255,0.65)", fontFamily: "Montserrat-SemiBold", fontSize: 10 }}
              xAxisLabelTextStyle={{ color: "rgba(255,255,255,0.78)", fontFamily: "Montserrat-SemiBold", fontSize: 10 }}
              hideDataPoints
              yAxisLabelPrefix=""
              yAxisLabelSuffix="%"
              noOfSections={4}
              adjustToWidth
            />
          </View>
        </LinearGradient>

        <View style={styles.streakCard}>
          <LinearGradient colors={["#2b1400", "#120700"]} style={styles.streakInner}>
            <View>
              <Text style={styles.streakLabel}>Day streak</Text>
              <Text style={styles.streakValue}>{streakValue} days</Text>
            </View>
            <View style={styles.streakIcon}>
              <Ionicons name="flame" size={28} color="#ff9100" />
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
                <Ionicons name="chevron-back" size={22} color="#ffe8b0" />
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

            <LinearGradient colors={["#2b1400", "#110600"]} style={styles.modalChart}>
              <View style={styles.modalChartInner}>
                <LineChart
                  data={(selectedWidget?.trend ?? resolvedChartData).map((point) => ({
                    label: point.label,
                    value: point.value,
                  }))}
                  curved
                  areaChart
                  height={220}
                  thickness={3}
                  spacing={chartSpacing}
                  initialSpacing={chartSpacing}
                  color="#ffb74d"
                  startFillColor="#ffb74d"
                  endFillColor="#ff9100"
                  startOpacity={0.26}
                  endOpacity={0.1}
                  yAxisColor="rgba(255,255,255,0.12)"
                  xAxisColor="rgba(255,255,255,0.12)"
                  yAxisTextStyle={{ color: "rgba(255,255,255,0.68)", fontFamily: "Montserrat-SemiBold", fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: "rgba(255,255,255,0.78)", fontFamily: "Montserrat-SemiBold", fontSize: 10 }}
                  hideDataPoints
                  yAxisLabelSuffix="%"
                  noOfSections={5}
                  adjustToWidth
                />
              </View>
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
    backgroundColor: "#050505",
  },
  header: {
    marginBottom: 24,
    marginTop: 12,
    gap: 6,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 28,
    fontFamily: "Montserrat-Bold",
    color: "#fdf7eb",
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 14,
    color: "#f1c27d",
    fontFamily: "Montserrat-SemiBold",
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  rangeChipActive: {
    backgroundColor: "#ff9100",
    borderColor: "#ff9100",
    shadowColor: "#ff9100",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  rangeLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.68)",
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.3,
  },
  rangeLabelActive: {
    color: "#0b0b0b",
  },
  chartCard: {
    borderRadius: 24,
    padding: 20,
    shadowColor: "#ff9100",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  chartWrapper: {
    marginTop: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 18,
    color: "#ffe8b0",
    fontFamily: "Montserrat-SemiBold",
  },
  chartSubtitle: {
    fontSize: 13,
    color: "rgba(255,224,178,0.82)",
    marginTop: 4,
    fontFamily: "Montserrat-SemiBold",
  },
  accuracyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffd54f",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  accuracyBadgeLabel: {
    color: "#0b0b0b",
    fontSize: 14,
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
    color: "#ffcc80",
    fontFamily: "Montserrat-SemiBold",
  },
  streakValue: {
    fontSize: 24,
    color: "#ffe8b0",
    fontFamily: "Montserrat-Bold",
  },
  streakIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,145,0,0.18)",
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
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  widgetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  widgetTitle: {
    fontSize: 14,
    color: "#ffe8b0",
    fontFamily: "Montserrat-SemiBold",
  },
  widgetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#ff9100",
  },
  widgetBadgeText: {
    fontSize: 10,
    color: "#0b0b0b",
    fontFamily: "Montserrat-Bold",
  },
  widgetValue: {
    marginTop: 18,
    fontSize: 26,
    color: "#fff5d6",
    fontFamily: "Montserrat-Bold",
  },
  widgetChange: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "Montserrat-SemiBold",
  },
  widgetPositive: {
    color: "#ffbf69",
  },
  widgetNegative: {
    color: "#ff7043",
  },
  widgetHint: {
    marginTop: 14,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Montserrat-SemiBold",
    letterSpacing: 0.3,
  },
  modalSafe: {
    flex: 1,
    backgroundColor: "#050505",
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
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    color: "#ffe8b0",
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
    color: "#fff5d6",
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
  modalChartInner: {
    borderRadius: 24,
    overflow: "hidden",
    paddingVertical: 4,
  },
  modalSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontFamily: "Montserrat-Bold",
    color: "#ffe8b0",
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Montserrat-SemiBold",
  },
});

export default ProgressScreen;
