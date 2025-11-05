import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from './api/client';

const difficultyColors: Record<string, string> = {
  Beginner: '#34C759',
  Intermediate: '#FF9500',
  Advanced: '#FF3B30'
};

const challenges = [
  {
    id: 'c1',
    title: '30-Day Form Sprint',
    description: 'Film and upload a form check every day for a month.'
  },
  {
    id: 'c2',
    title: 'Weekend Free Throw Jam',
    description: 'Join other shooters logging 500 weekend free throws.'
  },
  {
    id: 'c3',
    title: 'Arc Angels Crew',
    description: 'Compete for the highest arc consistency badge this week.'
  }
];

type Drill = {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  minutes: number;
  focus: string;
  steps?: string[];
  tags?: string[];
};

const DrillsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useQuery<Drill[]>({
    queryKey: ['drills'],
    queryFn: api.getDrills,
  });
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!data) return [];
    if (!query) return data;

    return data.filter(drill => {
      const haystack = [
        drill.name,
        drill.difficulty,
        drill.focus,
        drill.tags?.join(' ') ?? ''
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [data, q]);

  const sections = useMemo(() => {
    if (!filtered.length) return [];
    const grouped = filtered.reduce<Record<string, Drill[]>>((acc, drill) => {
      const category = drill.category;
      acc[category] = acc[category] ? [...acc[category], drill] : [drill];
      return acc;
    }, {});
    return Object.entries(grouped).map(([category, drills]) => ({
      title: category,
      data: drills
    }));
  }, [filtered]);

  const renderChallenge = ({ item }: { item: typeof challenges[number] }) => (
    <View style={styles.challengeCard}>
      <View style={{ gap: 6 }}>
        <Text style={styles.challengeTitle}>{item.title}</Text>
        <Text style={styles.challengeDescription}>{item.description}</Text>
      </View>
      <TouchableOpacity style={styles.challengeButton}>
        <Text style={styles.challengeButtonText}>Join</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#FF6F3C" />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            contentInsetAdjustmentBehavior="never"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24, paddingTop: 8 }]}
            ListHeaderComponent={
              <View style={styles.searchHeader}>
                <Text style={styles.heading}>Drills</Text>
                <TextInput
                  value={q}
                  onChangeText={setQ}
                  placeholder="Search drills, tags, or difficulty"
                  placeholderTextColor="#8e8e93"
                  style={styles.searchInput}
                  accessibilityLabel="Search drills"
                  autoCapitalize="none"
                />
              </View>
            }
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={styles.title}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.badge, { backgroundColor: difficultyColors[item.difficulty] || '#636366' }]}>
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
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No drills found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search keywords.</Text>
              </View>
            }
            ListFooterComponent={
              <View style={styles.challengesSection}>
                <Text style={styles.sectionHeader}>Community Challenges</Text>
                <FlatList
                  data={challenges}
                  keyExtractor={item => item.id}
                  renderItem={renderChallenge}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7'
  },
  content: {
    padding: 20,
    gap: 12
  },
  searchHeader: {
    gap: 12,
    marginBottom: 12
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c1e'
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#e5e5ea'
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
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e'
  },
  emptySubtitle: {
    color: '#6c6c70',
    textAlign: 'center'
  },
  challengesSection: {
    marginTop: 24,
    gap: 12
  },
  challengeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#00000010',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e'
  },
  challengeDescription: {
    color: '#6c6c70',
    fontSize: 14
  },
  challengeButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6F3C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999
  },
  challengeButtonText: {
    color: '#fff',
    fontWeight: '700'
  }
});

export default DrillsScreen;
