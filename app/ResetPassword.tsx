import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from './lib/supabase';

export default function ResetPassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const handleDeepLink = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        const { queryParams } = Linking.parse(url);
        if (queryParams?.token) {
          setAccessToken(queryParams.token as string);
          console.log('✅ Deep link detected:', url);
        } else {
          console.warn('⚠️ No token found in URL:', url);
        }
      }
    };
    handleDeepLink();
  }, []);

  async function handleReset() {
    if (!accessToken) {
      Alert.alert('Error', 'Reset token missing or invalid. Please use the link from your email.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      // Set the temporary session using the token
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: accessToken,
      });
      if (sessionError) throw sessionError;

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      Alert.alert('Success', 'Your password has been reset successfully!');
      router.replace('/Auth'); // ✅ Go back to login page
    } catch (error: any) {
      console.error('Reset error:', error);
      Alert.alert('Error', error.message || 'Something went wrong during reset.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter new password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Confirm Reset</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FF6F3C',
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
