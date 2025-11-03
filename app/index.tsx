import React, { useEffect } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from './lib/supabase';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace('/(tabs)/record');
          return;
        }

        if (Platform.OS === 'web') {
          const hash = window.location.hash || '';
          router.replace(`/Auth${hash}`);
        } else {
          router.replace('/Auth');
        }
      } catch (error) {
        console.error('Failed to determine initial route:', error);
        router.replace('/Auth');
      }
    };

    redirect();
  }, [router]);

  return (
    <View style={styles.container}>
      <Text>Loading…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
