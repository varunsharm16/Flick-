import React, { useEffect } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleRedirect = () => {
      const hash = window.location.hash;
      const match = hash.match(/access_token=([^&]+)/);

      if (!match) {
        return;
      }

      const token = decodeURIComponent(match[1]);

      if (!token) {
        return;
      }

      window.location.hash = '';

      redirectTimeout = setTimeout(() => {
        router.replace(`/ResetPassword?token=${token}`);
      }, 300);

    };

    const timeout = setTimeout(handleRedirect, 500);

    return () => {
      clearTimeout(timeout);
      if (redirectTimeout) {
        clearTimeout(redirectTimeout);
      }
    };
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Welcome to Flick!</Text>
      <Button title="Go to Profile" onPress={() => router.push('/Profile')} />
    </View>
  );
}
