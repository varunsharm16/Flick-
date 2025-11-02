import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { supabase } from './lib/supabase';

export default function ResetPassword() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

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
    setStatusMessage('');
    setIsSuccess(null);

    if (!accessToken) {
      const message = 'Reset token missing or invalid. Please use the link from your email.';
      Alert.alert('Error', message);
      setStatusMessage(message);
      setIsSuccess(false);
      return;
    }

    if (newPassword.length < 6) {
      const message = 'Password must be at least 6 characters long.';
      Alert.alert('Error', message);
      setStatusMessage(message);
      setIsSuccess(false);
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

      const message = 'Your password has been reset successfully!';
      Alert.alert('Success', message);
      setStatusMessage(message);
      setIsSuccess(true);
      router.replace('/Auth'); // ✅ Go back to login page
    } catch (error: any) {
      console.error('Reset error:', error);
      const message = error.message || 'Something went wrong during reset.';
      Alert.alert('Error', message);
      setStatusMessage(message);
      setIsSuccess(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Your Password</Text>
      <Text style={styles.description}>
        Enter your new password in the space below to complete the reset process.
      </Text>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Submit New Password</Text>
      </TouchableOpacity>
      {statusMessage ? (
        <Text
          style={[
            styles.statusMessage,
            isSuccess === true && styles.successMessage,
            isSuccess === false && styles.errorMessage,
          ]}
        >
          {statusMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  description: { fontSize: 16, textAlign: 'center', marginBottom: 20, color: '#4a4a4a' },
  inputContainer: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    marginBottom: 20,
  },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
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
  statusMessage: { marginTop: 16, fontSize: 14, textAlign: 'center' },
  successMessage: { color: '#2f9d63' },
  errorMessage: { color: '#d93025' },
});
