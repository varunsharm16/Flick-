import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';

import MetricCard from './components/MetricCard';
import TrendChart from './components/TrendChart';
import ProBadge from './components/ProBadge';
import CoachSheet, { ChatMessage } from './components/CoachSheet';
import { api } from './api/client';
import { useSession } from './store/useSession';
import { AppTheme, AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

const createStyles = (colors: AppThemeColors, spacing: AppTheme['spacing'], typography: AppTheme['typography']) =>
  StyleSheet.create({
    scrollContent: {
      paddingBottom: spacing.section * 6,
      gap: spacing.section,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: typography.headline,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.body,
      color: colors.muted,
    },
    coachButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.itemGap / 2,
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    coachLabel: {
      fontWeight: '600',
      color: colors.accent,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -spacing.itemGap / 2,
    },
    metricItem: {
      width: '50%',
      padding: spacing.itemGap / 2,
    },
    trendCard: {
      backgroundColor: colors.surface,
      borderRadius: spacing.cardRadius,
      padding: spacing.section,
      gap: spacing.itemGap,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    trendHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    trendTitle: {
      fontSize: typography.subtitle,
      fontWeight: '700',
      color: colors.text,
    },
    trendLocked: {
      height: 180,
      borderRadius: spacing.cardRadius,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.itemGap,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accent,
      paddingHorizontal: spacing.section,
    },
    lockedText: {
      color: colors.accent,
      fontWeight: '600',
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.section,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: spacing.cardRadius + 8,
      padding: spacing.section,
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
      gap: spacing.itemGap,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: typography.subtitle,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.text,
    },
    modalBody: {
      fontSize: typography.body,
      color: colors.muted,
      textAlign: 'center',
    },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingHorizontal: spacing.section,
      paddingVertical: 14,
      width: '100%',
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#fff',
      fontWeight: '700',
    },
    secondaryButton: {
      paddingVertical: 10,
    },
    secondaryButtonText: {
      color: colors.muted,
      fontWeight: '600',
    },
  });

const ProgressScreen: React.FC = () => {
  const [coachOpen, setCoachOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ready to break down your mechanics? Ask me anything about your shot.',
    },
  ]);
  const [coachInput, setCoachInput] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { isPro, userId, upgradeToPro } = useSession();
  const { colors, sharedStyles, spacing, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, spacing, typography), [colors, spacing, typography]);

  const period = '7d';
  const { data: progress, isLoading } = useQuery({
    queryKey: ['progress', period],
    queryFn: () => api.getProgress(period),
  });

  const coachMutation = useMutation({
    mutationFn: api.postCoach,
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: response.reply,
        },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: 'I missed that one. Try again in a moment?',
        },
      ]);
    },
  });

  const metrics = useMemo(() => {
    if (!progress) return [];
    return [
      {
        id: 'shootingAccuracy',
        title: 'Shooting Accuracy',
        value: `${Math.round(progress.shootingAccuracy * 100)}%`,
        deltaLabel: `+${Math.round(progress.deltaAccuracy * 100)}%`,
        deltaPositive: progress.deltaAccuracy >= 0,
      },
      {
        id: 'formConsistency',
        title: 'Form Consistency',
        value: `${Math.round(progress.formConsistency * 100)}%`,
        deltaLabel: `+${Math.round(progress.deltaForm * 100)}%`,
        deltaPositive: progress.deltaForm >= 0,
      },
      {
        id: 'shotsTaken',
        title: 'Shots Taken',
        value: `${progress.shotsTaken}`,
        deltaLabel: `+${progress.deltaShots}`,
        deltaPositive: progress.deltaShots >= 0,
      },
      {
        id: 'releaseTime',
        title: 'Release Time',
        value: `${progress.releaseTime.toFixed(2)}s`,
        deltaLabel: `${progress.deltaRelease > 0 ? '+' : ''}${progress.deltaRelease.toFixed(2)}s`,
        deltaPositive: progress.deltaRelease <= 0,
        requiresPro: true,
      },
      {
        id: 'followThrough',
        title: 'Follow Through',
        value: `${Math.round(progress.followThrough * 100)}%`,
        deltaLabel: `+${Math.round(progress.deltaFollow * 100)}%`,
        deltaPositive: progress.deltaFollow >= 0,
        requiresPro: true,
      },
      {
        id: 'arcAngle',
        title: 'Arc Angle',
        value: `${progress.arcAngle}°`,
        note: progress.arcNote,
        requiresPro: true,
      },
    ];
  }, [progress]);

  const handleCoachSend = () => {
    if (!coachInput.trim()) return;
    const text = coachInput.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
      },
    ]);
    setCoachInput('');
    coachMutation.mutate({ text, userId });
  };

  const lockedMetrics = !isPro;

  return (
    <View style={sharedStyles.screen}>
      <ScrollView contentContainerStyle={[styles.scrollContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Last 7 Days</Text>
          </View>
          <TouchableOpacity style={styles.coachButton} onPress={() => setCoachOpen(true)}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.accent} />
            <Text style={styles.coachLabel}>AI Coach</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          {isLoading && !progress ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.section * 2 }} />
          ) : (
            metrics.map((metric) => (
              <View key={metric.id} style={styles.metricItem}>
                <MetricCard
                  title={metric.title}
                  value={metric.value}
                  deltaLabel={metric.deltaLabel}
                  deltaPositive={metric.deltaPositive}
                  note={metric.note}
                  requiresPro={metric.requiresPro}
                  locked={lockedMetrics && metric.requiresPro}
                  onPress={
                    lockedMetrics && metric.requiresPro ? () => setShowUpgrade(true) : undefined
                  }
                />
              </View>
            ))
          )}
        </View>

        {progress && (
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <Text style={styles.trendTitle}>Shooting Accuracy Trend</Text>
              {!isPro && <ProBadge />}
            </View>
            {lockedMetrics ? (
              <TouchableOpacity style={styles.trendLocked} onPress={() => setShowUpgrade(true)}>
                <Ionicons name="lock-closed" size={20} color={colors.accent} />
                <Text style={styles.lockedText}>Upgrade to PRO to view detailed trends</Text>
              </TouchableOpacity>
            ) : (
              <TrendChart data={progress.accuracyTrend} />
            )}
          </View>
        )}
      </ScrollView>

      <CoachSheet
        visible={coachOpen}
        onClose={() => setCoachOpen(false)}
        messages={messages}
        input={coachInput}
        onInputChange={setCoachInput}
        onSend={handleCoachSend}
        sending={coachMutation.isLoading}
      />

      <Modal visible={showUpgrade} transparent animationType="fade" onRequestClose={() => setShowUpgrade(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ProBadge />
            <Text style={styles.modalTitle}>Unlock advanced insights</Text>
            <Text style={styles.modalBody}>
              Detailed release, follow-through, and arc metrics are part of Flick PRO.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                upgradeToPro();
                setShowUpgrade(false);
              }}
            >
              <Text style={styles.primaryButtonText}>Upgrade to PRO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowUpgrade(false)}>
              <Text style={styles.secondaryButtonText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProgressScreen;
