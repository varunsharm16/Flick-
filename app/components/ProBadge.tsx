import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface ProBadgeProps {
  active?: boolean;
}

const ProBadge: React.FC<ProBadgeProps> = ({ active = true }) => {
  return (
    <View style={[styles.badge, !active && styles.badgeInactive]}>
      <Text style={[styles.text, !active && styles.textInactive]}>PRO</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999
  },
  badgeInactive: {
    backgroundColor: '#ffe4b8'
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
  textInactive: {
    color: '#c15e00'
  }
});

export default ProBadge;
