import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ProBadge from './ProBadge';

interface MetricCardProps {
  title: string;
  value: string;
  deltaLabel?: string;
  deltaPositive?: boolean;
  note?: string;
  requiresPro?: boolean;
  locked?: boolean;
  onPress?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  deltaLabel,
  deltaPositive,
  note,
  requiresPro,
  locked,
  onPress
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { transform: [{ scale: 0.99 }] },
        locked && styles.locked
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {requiresPro && <ProBadge active={!locked} />}
      </View>
      <Text style={styles.value}>{value}</Text>
      {deltaLabel && (
        <View style={styles.deltaRow}>
          <Ionicons
            name={deltaPositive ? 'arrow-up' : 'arrow-down'}
            size={14}
            color={deltaPositive ? '#34C759' : '#FF3B30'}
          />
          <Text
            style={[
              styles.deltaText,
              { color: deltaPositive ? '#34C759' : '#FF3B30' }
            ]}
          >
            {deltaLabel}
          </Text>
          <Text style={styles.deltaSuffix}>vs last period</Text>
        </View>
      )}
      {note && <Text style={styles.note}>{note}</Text>}
      {locked && (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={16} color="#FF9500" />
          <Text style={styles.lockText}>Upgrade to unlock</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#00000010',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2
  },
  locked: {
    borderWidth: 1,
    borderColor: '#ffe4b8',
    backgroundColor: '#fff9f0'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f1f1f',
    flex: 1,
    marginRight: 8
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c1e'
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  deltaText: {
    fontSize: 14,
    fontWeight: '600'
  },
  deltaSuffix: {
    fontSize: 12,
    color: '#6c6c70'
  },
  note: {
    fontSize: 13,
    color: '#6c6c70'
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6
  },
  lockText: {
    color: '#FF9500',
    fontWeight: '600'
  }
});

export default MetricCard;
