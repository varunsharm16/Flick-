import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from './api/client';

const difficultyColors: Record<string, string> = {
  Beginner: '#34C759',
  Intermediate: '#FF9500',
  Advanced: '#FF3B30'
};

const DrillsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data, isLoading } = useQuery({
    queryKey: ['drills'],
    queryFn: api.getDrills,
  });


  const sections = useMemo(() => {
    if (!data) return [];
    const grouped = data.reduce<Record<string, typeof data>>((acc, drill) => {
      acc[drill.category] = acc[drill.category] ? [...acc[drill.category], drill] : [drill];
      return acc;
    }, {});
    return Object.entries(grouped).map(([category, drills]) => ({
      title: category,
      data: drills
    }));
  }, [data]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#FF6F3C" />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.content}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={styles.title}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <View style={[styles.badge, { backgroundColor: difficultyColors[item.difficulty] }]}>
                    <Text style={styles.badgeText}>{item.difficulty}</Text>
                  </View>
                  <Text style={styles.metaText}>{item.minutes} min</Text>
                  <Text style={styles.metaText}>{item.focus}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => navigation.navigate('DrillDetail' as never, { id: item.id } as never)}
              >
                <Text style={styles.ctaText}>Start</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  content: {
    padding: 20,
    paddingBottom: 120
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 16,
    color: '#1c1c1e'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#00000010',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap'
  },
  metaText: {
    color: '#6c6c70',
    fontSize: 14
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600'
  },
  ctaButton: {
    backgroundColor: '#FF6F3C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700'
  }
});

export default DrillsScreen;
