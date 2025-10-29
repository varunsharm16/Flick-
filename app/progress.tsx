import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';

import MetricCard from './components/MetricCard';
import TrendChart from './components/TrendChart';
import ProBadge from './components/ProBadge';
import CoachSheet, { ChatMessage } from './components/CoachSheet';
import { api } from './api/client';
import { useSession } from './store/useSession';

const ProgressScreen: React.FC = () => {
  const [coachOpen, setCoachOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ready to break down your mechanics? Ask me anything about your shot.'
    }
  ]);
  const [coachInput, setCoachInput] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { isPro, setProfile, userId, upgradeToPro } = useSession();

  // const { data: progress, isLoading } = useQuery(['progress', '7d'], api.getProgress);
  const period = '7d';
  const { data: progress, isLoading } = useQuery({
    queryKey: ['progress', period],
    queryFn: () => api.getProgress(period),
  });



  const coachMutation = useMutation({
    mutationFn: api.postCoach,
    onSuccess: response => {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: response.reply
        }
      ]);
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: 'I missed that one. Try again in a moment?'
        }
      ]);
    }
  });

  const metrics = useMemo(() => {
    if (!progress) return [];
    return [
      {
        id: 'shootingAccuracy',
        title: 'Shooting Accuracy',
        value: `${Math.round(progress.shootingAccuracy * 100)}%`,
        deltaLabel: `+${Math.round(progress.deltaAccuracy * 100)}%`,
        deltaPositive: progress.deltaAccuracy >= 0
      },
      {
        id: 'formConsistency',
        title: 'Form Consistency',
        value: `${Math.round(progress.formConsistency * 100)}%`,
        deltaLabel: `+${Math.round(progress.deltaForm * 100)}%`,
        deltaPositive: progress.deltaForm >= 0
      },
      {
        id: 'shotsTaken',
        title: 'Shots Taken',
        value: `${progress.shotsTaken}`,
        deltaLabel: `+${progress.deltaShots}`,
        deltaPositive: progress.deltaShots >= 0
      },
      {
        id: 'releaseTime',
        title: 'Release Time',
        value: `${progress.releaseTime.toFixed(2)}s`,
        deltaLabel: `${progress.deltaRelease > 0 ? '+' : ''}${progress.deltaRelease.toFixed(2)}s`,
        deltaPositive: progress.deltaRelease <= 0,
        requiresPro: true
      },
      {
        id: 'followThrough',
        title: 'Follow Through',
        value: `${Math.round(progress.followThrough * 100)}%`,
        deltaLabel: `+${Math.round(progress.deltaFollow * 100)}%`,
        deltaPositive: progress.deltaFollow >= 0,
        requiresPro: true
      },
      {
        id: 'arcAngle',
        title: 'Arc Angle',
        value: `${progress.arcAngle}°`,
        note: progress.arcNote,
        requiresPro: true
      }
    ];
  }, [progress]);

  const handleCoachSend = () => {
    if (!coachInput.trim()) return;
    const text = coachInput.trim();
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text
      }
    ]);
    setCoachInput('');
    coachMutation.mutate({ text, userId });
  };

  const lockedMetrics = !isPro;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Progress</Text>
            <Text style={styles.subtitle}>Last 7 Days</Text>
          </View>
          <TouchableOpacity style={styles.coachButton} onPress={() => setCoachOpen(true)}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FF6F3C" />
            <Text style={styles.coachLabel}>AI Coach</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          {isLoading && !progress ? (
            <ActivityIndicator color="#FF6F3C" style={{ marginTop: 40 }} />
          ) : (
            metrics.map(metric => (
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
                    lockedMetrics && metric.requiresPro
                      ? () => setShowUpgrade(true)
                      : undefined
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
                <Ionicons name="lock-closed" size={20} color="#FF9500" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    gap: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1c1c1e'
  },
  subtitle: {
    fontSize: 16,
    color: '#6c6c70'
  },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#00000015',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2
  },
  coachLabel: {
    fontWeight: '600',
    color: '#FF6F3C'
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8
  },
  metricItem: {
    width: '50%',
    padding: 8
  },
  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#00000010',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  trendTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e'
  },
  trendLocked: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#fff9f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ffe4b8'
  },
  lockedText: {
    color: '#c15e00',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 16
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center'
  },
  modalBody: {
    fontSize: 15,
    color: '#6c6c70',
    textAlign: 'center'
  },
  primaryButton: {
    backgroundColor: '#FF6F3C',
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  secondaryButton: {
    paddingVertical: 10
  },
  secondaryButtonText: {
    color: '#6c6c70'
  }
});

export default ProgressScreen;
