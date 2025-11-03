import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTheme,
} from 'victory-native';

import { api } from '../../api/client';

const CARD_GRADIENTS = [
  ['#1e293b', '#0f172a'],
  ['#1b4332', '#0b3d2e'],
  ['#3b0764', '#1e1b4b'],
];

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['progress-overview'],
    queryFn: () => api.getProgress('14d'),
  });

  const chartData = useMemo(
    () =>
      data?.accuracyTrend?.map((point, index) => ({
        x: index + 1,
        label: point.day,
        y: Math.round((point.v ?? 0) * 100),
      })) ?? [],
    [data?.accuracyTrend],
  );

  const cards = useMemo(() => {
    if (!data) return [];
    const accuracy = Math.round((data.shootingAccuracy ?? 0) * 100);
    const accuracyDelta = Math.round((data.deltaAccuracy ?? 0) * 100);
    const consistency = Math.round((data.formConsistency ?? 0) * 100);
    const sessions = data.accuracyTrend?.length ?? 0;

    return [
      {
        id: 'avg-accuracy',
        title: 'Average accuracy',
        value: `${accuracy}%`,
        note: `${accuracyDelta >= 0 ? '+' : ''}${accuracyDelta}% vs last week`,
      },
      {
        id: 'consistency',
        title: 'Shot consistency',
        value: `${consistency}%`,
        note: consistency > 80 ? 'Release is feeling automatic' : 'Keep smoothing the follow-through',
      },
      {
        id: 'sessions',
        title: 'Sessions this week',
        value: `${sessions}`,
        note: sessions >= 5 ? 'Elite work ethic' : 'Let’s stack a few more reps',
      },
    ];
  }, [data]);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Your Shooting Progress</Text>
        <Text style={styles.subheading}>Dialed-in mechanics turn consistency into confidence.</Text>

        <View style={styles.chartWrapper}>
          <LinearGradient
            colors={['rgba(34, 197, 94, 0.15)', 'rgba(15, 23, 42, 0.65)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chartGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#22c55e" />
            ) : (
              <VictoryChart
                animate={{ duration: 700, easing: 'quadInOut' }}
                theme={VictoryTheme.material}
                padding={{ top: 48, left: 48, right: 24, bottom: 48 }}
                height={260}
              >
                <VictoryAxis
                  tickFormat={(value) => chartData[value - 1]?.label ?? ''}
                  style={{
                    axis: { stroke: 'transparent' },
                    grid: { stroke: 'rgba(148, 163, 184, 0.2)' },
                    tickLabels: { fill: 'rgba(226, 232, 240, 0.75)', fontSize: 12, fontWeight: '600' },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(value) => `${value}%`}
                  style={{
                    axis: { stroke: 'transparent' },
                    grid: { stroke: 'rgba(148, 163, 184, 0.15)' },
                    tickLabels: { fill: 'rgba(226, 232, 240, 0.6)', fontSize: 11 },
                  }}
                />
                <VictoryLine
                  data={chartData}
                  interpolation="monotoneX"
                  style={{
                    data: { stroke: '#22c55e', strokeWidth: 4 },
                  }}
                />
                <VictoryScatter
                  data={chartData}
                  size={6}
                  style={{ data: { fill: '#4ade80', strokeWidth: 0 } }}
                />
              </VictoryChart>
            )}
          </LinearGradient>
        </View>

        <View style={styles.cardGrid}>
          {cards.map((card, index) => (
            <LinearGradient
              key={card.id}
              colors={CARD_GRADIENTS[index % CARD_GRADIENTS.length]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardNote}>{card.note}</Text>
            </LinearGradient>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    paddingHorizontal: 24,
    gap: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.2,
  },
  subheading: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  chartWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
  chartGradient: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  cardGrid: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  cardTitle: {
    color: 'rgba(226, 232, 240, 0.7)',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  cardValue: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardNote: {
    color: 'rgba(226, 232, 240, 0.7)',
    fontSize: 13,
  },
});
