import React, { useEffect, useRef } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    let redirectTimeout: ReturnType<typeof setTimeout> | undefined;

    const handleRedirect = () => {
      if (hasRedirectedRef.current) {
        return;
      }

      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const type = params.get('type');
      const token = params.get('access_token');

      if (type !== 'recovery' || !token) {
        return;
      }

      window.location.hash = '';
      hasRedirectedRef.current = true;

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
