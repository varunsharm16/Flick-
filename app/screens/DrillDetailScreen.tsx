import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { api } from '../api/client';

const DrillDetailScreen: React.FC = () => {
  const route = useRoute();
  const { id } = route.params as { id: string };
  const { data, isLoading } = useQuery(['drills'], api.getDrills);

  const drill = useMemo(() => data?.find(item => item.id === id), [data, id]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF6F3C" />
      </View>
    );
  }

  if (!drill) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Drill not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{drill.name}</Text>
      <Text style={styles.meta}>{drill.difficulty} · {drill.minutes} min · Focus: {drill.focus}</Text>
      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoText}>Video coming soon</Text>
      </View>
      <Text style={styles.sectionTitle}>Steps</Text>
      <FlatList
        data={drill.steps}
        keyExtractor={(item, index) => `${drill.id}-step-${index}`}
        renderItem={({ item, index }) => (
          <View style={styles.stepRow}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepIndex}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 20,
    gap: 16
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  missing: {
    color: '#6c6c70'
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1c1c1e'
  },
  meta: {
    color: '#6c6c70',
    fontSize: 15
  },
  videoPlaceholder: {
    height: 200,
    borderRadius: 16,
    backgroundColor: '#d1d1d6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  videoText: {
    color: '#fff',
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    color: '#1c1c1e'
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6F3C',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepIndex: {
    color: '#fff',
    fontWeight: '700'
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#1c1c1e'
  }
});

export default DrillDetailScreen;
