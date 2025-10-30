import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from 'victory-native';

export type TrendPoint = { date?: string; value?: number };

interface TrendChartProps {
  data?: TrendPoint[];
  title?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, title }) => {
  const width = Dimensions.get('window').width - 32;
  const points = (data?.length
    ? data.map((point, index) => ({ x: index + 1, y: Number(point.value ?? 0) }))
    : [...Array(7)].map((_, index) => ({ x: index + 1, y: 60 + Math.random() * 10 })));

  return (
    <View style={[styles.container, { width }]}> 
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <VictoryChart width={width} theme={VictoryTheme.material} domainPadding={{ y: 8 }}>
        <VictoryAxis style={{ tickLabels: { fontSize: 10, fill: '#6c6c70' } }} />
        <VictoryAxis dependentAxis style={{ tickLabels: { fontSize: 10, fill: '#6c6c70' } }} />
        <VictoryLine
          data={points}
          x="x"
          y="y"
          style={{ data: { stroke: '#16a34a', strokeWidth: 3, strokeLinecap: 'round' } }}
          interpolation="monotoneX"
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#00000010',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
  },
});

export default TrendChart;
