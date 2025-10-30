// TrendChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

type Pt = { x: number | string; y: number | null | undefined };

interface TrendChartProps {
  title?: string;
  data?: Pt[];               // [{x: 'Mon', y: 68}, ...]
}

const TrendChart: React.FC<TrendChartProps> = ({ title, data }) => {
  const width = Dimensions.get('window').width - 32; // padding-safe width

  // 1) Normalize to pure numbers; drop/repair bad points
  const cleaned = (data ?? [])
    .map(p => ({
      label: typeof p.x === 'string' ? p.x : String(p.x ?? ''),
      value: Number.isFinite(Number(p.y)) ? Number(p.y) : null,
    }))
    .filter(p => p.value !== null) as { label: string; value: number }[];

  // 2) Provide a small fallback to avoid empty/NaN paths
  const safeData =
    cleaned.length > 0
      ? cleaned.map(p => ({ value: p.value, label: p.label }))
      : [
          { value: 60, label: 'Mon' },
          { value: 62, label: 'Tue' },
          { value: 58, label: 'Wed' },
          { value: 64, label: 'Thu' },
          { value: 67, label: 'Fri' },
          { value: 65, label: 'Sat' },
          { value: 68, label: 'Sun' },
        ];

  return (
    <View style={[styles.container, { width }]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <LineChart
        data={safeData}              // IMPORTANT: gifted-charts expects [{value, label}]
        curved
        areaChart                   // keep if expo-linear-gradient is installed; remove if not
        startFillColor="#22c55e"
        endFillColor="#22c55e"
        startOpacity={0.15}
        endOpacity={0.01}
        thickness={3}
        color="#22c55e"
        hideRules
        yAxisTextStyle={{ color: '#9AA0A6', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#9AA0A6', fontSize: 10 }}
        yAxisColor="#E6E6E6"
        xAxisColor="#E6E6E6"
        initialSpacing={20}
        spacing={40}
        noOfSections={4}
        adjustToWidth
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
});

export default TrendChart;
