import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { VictoryArea, VictoryChart, VictoryTheme } from 'victory-native';

interface TrendChartProps {
  data: { day: string; v: number }[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const width = Dimensions.get('window').width - 48;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shooting Accuracy Trend</Text>
      <VictoryChart
        height={200}
        width={width}
        padding={{ top: 24, bottom: 40, left: 40, right: 16 }}
        theme={VictoryTheme.material}
        domain={{ y: [0.4, 0.85] }}
      >
        <VictoryArea
          interpolation="monotoneX"
          style={{
            data: {
              fill: 'rgba(255,111,60,0.2)',
              stroke: '#FF6F3C',
              strokeWidth: 3
            }
          }}
          data={data.map(point => ({ x: point.day, y: point.v }))}
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#00000010',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginLeft: 12
  }
});

export default TrendChart;
