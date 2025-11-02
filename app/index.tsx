import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const recoveryTriggered = useRef(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const forceRecovery = useRef(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    try {
      if (localStorage.getItem('recoveryMode') === 'true') {
        setMode('recovery');
        forceRecovery.current = true;
        recoveryTriggered.current = true;
        setResetSuccess(false);

        const savedAccess = localStorage.getItem('recoveryAccess');
        const savedRefresh = localStorage.getItem('recoveryRefresh');
        const savedEmail = localStorage.getItem('recoveryEmail');

        if (savedAccess) setAccessToken(savedAccess);
        if (savedRefresh) setRefreshToken(savedRefresh);
        if (savedEmail) setRecoveryEmail(savedEmail);

        if (!savedAccess) {
          console.log('No recovery token found in storage.');
        }
      }
    } catch (error) {
      console.warn('Unable to read recovery state from storage:', error);
    }
  }, []);

  useLayoutEffect(() => {
    if (Platform.OS !== 'web') {
      setBootstrapped(true);
      return;
    }

    let detected = false;

    const readHashOnce = () => {
      const raw = window.location.hash || '';
      const hash = raw.startsWith('#') ? raw.slice(1) : raw;
      const params = new URLSearchParams(hash);

      const type = params.get('type');
      const token = params.get('access_token');
      const refresh = params.get('refresh_token');
      const emailParam = params.get('email');

      if (type === 'recovery' && token) {
        console.log('✅ Recovery detected (layout)');
        forceRecovery.current = true;
        recoveryTriggered.current = true;
        setMode('recovery');
        setAccessToken(token);
        setRefreshToken(refresh ?? token);
        setResetSuccess(false);
        if (emailParam) setRecoveryEmail(emailParam);

        if (Platform.OS === 'web') {
          try {
            localStorage.setItem('recoveryMode', 'true');
            localStorage.setItem('recoveryAccess', token);
            localStorage.setItem('recoveryRefresh', refresh ?? token);
            if (emailParam) localStorage.setItem('recoveryEmail', emailParam);
          } catch (error) {
            console.warn('Unable to persist recovery state:', error);
          }
        }

        if (window.history?.replaceState) {
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}${window.location.search}`,
          );
        }

        detected = true;
      }
    };

    readHashOnce();

    if (!detected) {
      let tries = 0;
      const interval = setInterval(() => {
        if (tries++ > 5) {
          clearInterval(interval);
          setBootstrapped(true);
          return;
        }
        readHashOnce();
        if (forceRecovery.current) {
          clearInterval(interval);
          setBootstrapped(true);
        }
      }, 150);
      return () => clearInterval(interval);
    }

    setBootstrapped(true);
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
    try {
      const token = accessToken ?? (Platform.OS === 'web' ? localStorage.getItem('recoveryAccess') : null);
      const refresh =
        (refreshToken ?? (Platform.OS === 'web' ? localStorage.getItem('recoveryRefresh') : null)) || token || null;

      if (!token) {
        Alert.alert('Error', 'Reset token missing. Re-open the email link or go back to login.');
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long.');
        return;
      }

      setLoading(true);

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refresh ?? token,
      });
      if (sessionError) {
        throw sessionError;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        throw updateError;
      }

      try {
        if (Platform.OS === 'web') {
          localStorage.removeItem('recoveryMode');
          localStorage.removeItem('recoveryAccess');
          localStorage.removeItem('recoveryRefresh');
          localStorage.removeItem('recoveryEmail');
        }
      } catch (storageError) {
        console.warn('Unable to clear recovery state:', storageError);
      }

      setNewPassword('');
      setAccessToken(null);
      setRefreshToken(null);
      setRecoveryEmail('');
      setResetSuccess(true);
      Alert.alert('Success', 'Your password has been reset. Please sign in.');
      setMode('login');
      recoveryTriggered.current = false;
      forceRecovery.current = false;
    } catch (error: any) {
      console.error('Reset error:', error);
      Alert.alert('Error', error.message || 'Something went wrong during reset.');
    } finally {
      setLoading(false);
    }
  }

  const handleBackToLogin = () => {
    setMode('login');
    setResetSuccess(false);
    setNewPassword('');
    setRecoveryEmail('');
    setAccessToken(null);
    setRefreshToken(null);
    forceRecovery.current = false;
    recoveryTriggered.current = false;
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem('recoveryMode');
        localStorage.removeItem('recoveryAccess');
        localStorage.removeItem('recoveryRefresh');
        localStorage.removeItem('recoveryEmail');
      } catch (error) {
        console.warn('Unable to clear recovery state:', error);
      }
    }
  };

  useEffect(() => {
    if (mode === 'recovery' || recoveryTriggered.current || forceRecovery.current) {
      console.log('Recovery mode persisted');
    }
  }, [mode]);

  if (!bootstrapped) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading…</Text>
      </View>
    );
  }

  if (forceRecovery.current || mode === 'recovery' || recoveryTriggered.current) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Reset Your Password</Text>
        {resetSuccess && (
          <>
            <Text style={styles.successText}>Your password has been reset successfully.</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToLogin}>
              <Text style={styles.secondaryButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </>
        )}
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

      {resetSuccess && (
        <Text style={styles.successText}>Your password has been reset. Please sign in.</Text>
      )}

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
  secondaryButton: {
    backgroundColor: '#fff',
    borderColor: '#FF6F3C',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#FF6F3C',
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 6,
  },
  linkText: {
    color: '#FF6F3C',
    fontWeight: '600',
  },
  successText: {
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
