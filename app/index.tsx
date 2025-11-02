import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from './lib/supabase';

export default function Index() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;

    const params = new URLSearchParams(hash);
    const type = params.get('type');
    const token = params.get('access_token');
    const refresh = params.get('refresh_token');
    const emailParam = params.get('email');

    if (type === 'recovery' && token) {
      console.log('Recovery mode activated');
      window.location.hash = '';
      setMode('recovery');
      setAccessToken(token);
      setRefreshToken(refresh ?? token);
      if (emailParam) {
        setRecoveryEmail(emailParam);
      }
    }
  }, []);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) alert(error.message);
    else router.replace('/Profile');
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) alert(error.message);
    else alert('Check your email for confirmation before logging in.');
  }

  async function handleForgotPassword() {
    if (!email) {
      alert('Please enter your email first.');
      return;
    }

    setLoading(true);
    const redirectTo =
      Platform.OS === 'web'
        ? `${window.location.origin}${window.location.pathname}`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      redirectTo ? { redirectTo } : undefined,
    );
    setLoading(false);

    if (error) alert(error.message);
    else alert('Password reset email sent! Check your inbox.');
  }

  async function handlePasswordReset() {
    if (!accessToken) {
      Alert.alert('Error', 'Reset token missing or invalid. Please use the link from your email.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? accessToken,
      });
      if (sessionError) {
        throw sessionError;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        throw updateError;
      }

      Alert.alert('Success', 'Your password has been reset successfully!');
      setMode('login');
      setNewPassword('');
      setAccessToken(null);
      setRefreshToken(null);
    } catch (error: any) {
      console.error('Reset error:', error);
      Alert.alert('Error', error.message || 'Something went wrong during reset.');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'recovery') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Reset Your Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={recoveryEmail}
          onChangeText={setRecoveryEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handlePasswordReset} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '...' : 'Update Password'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Flick Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={signIn} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '...' : 'Sign In'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleForgotPassword} style={styles.linkButton}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signUp} style={styles.linkButton}>
        <Text style={styles.linkText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#FF6F3C',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  linkButton: {
    paddingVertical: 6,
  },
  linkText: {
    color: '#FF6F3C',
    fontWeight: '600',
  },
});
