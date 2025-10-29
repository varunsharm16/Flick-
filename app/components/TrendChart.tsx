import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

type Pt = { day: string; v: number };
type Props = { data?: Pt[]; title?: string };

const createStyles = (colors: AppThemeColors) =>
  StyleSheet.create({
    container: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 8,
      alignItems: 'stretch',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    placeholder: {
      color: colors.muted,
    },
  });

export default function TrendChart({ data = [], title }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const ys = data.map((d) => d.v);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 12;
  const W = width - pad * 2;
  const H = height - pad * 2;

  const x = (i: number) => pad + (i / Math.max(1, xs.length - 1)) * W;
  const y = (v: number) => pad + H - ((v - minY) / Math.max(1, maxY - minY)) * H;

  let area = `M ${x(0)} ${y(ys[0])}`;
  for (let i = 1; i < xs.length; i++) area += ` L ${x(i)} ${y(ys[i])}`;
  area += ` L ${x(xs.length - 1)} ${pad + H} L ${x(0)} ${pad + H} Z`;

  const line = `M ${x(0)} ${y(ys[0])}` + xs.slice(1).map((_, i) => ` L ${x(i + 1)} ${y(ys[i + 1])}`).join('');

  return (
    <View style={[styles.container, { width }]}> 
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={colors.surface} />
        <Path d={area} opacity={0.2} fill={colors.accent} />
        <Path d={line} strokeWidth={2} fill="none" stroke={colors.accent} />
      </Svg>
    </View>
  );
}
