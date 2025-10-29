import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

type Pt = { day: string; v: number };
type Props = { data?: Pt[]; title?: string };

export default function TrendChart({ data = [], title }: Props) {
  const width = Math.max(280, Dimensions.get('window').width - 32);
  const height = 160;

  if (!data.length) {
    return (
      <View style={[styles.container, { width }]}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <Text style={styles.placeholder}>No trend data yet</Text>
      </View>
    );
  }

  const xs = data.map((_, i) => i);
  const ys = data.map(d => d.v);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 12;
  const W = width - pad * 2;
  const H = height - pad * 2;

  const x = (i: number) => pad + (i / Math.max(1, xs.length - 1)) * W;
  const y = (v: number) => pad + H - ((v - minY) / Math.max(1, maxY - minY)) * H;

  // area path
  let d = `M ${x(0)} ${y(ys[0])}`;
  for (let i = 1; i < xs.length; i++) d += ` L ${x(i)} ${y(ys[i])}`;
  d += ` L ${x(xs.length - 1)} ${pad + H} L ${x(0)} ${pad + H} Z`;

  return (
    <View style={[styles.container, { width }]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill="white" />
        <Path d={d} opacity={0.2} />
        <Path
          d={`M ${x(0)} ${y(ys[0])}` + xs.slice(1).map((_, i) => ` L ${x(i+1)} ${y(ys[i+1])}`).join('')}
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, borderRadius: 12, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  placeholder: { opacity: 0.6 },
});
