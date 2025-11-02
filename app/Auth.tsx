import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from './lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) alert(error.message);
    else router.replace('/Profile'); // 👈 redirect after successful login
  }

  async function handleForgotPassword() {
    if (!email) {
      alert('Please enter your email first.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'exp://192.168.0.120:8081/--/ResetPassword',
    });
    setLoading(false);

    if (error) alert(error.message);
    else alert('Password reset email sent! Check your inbox.');
  }

  async function signUp() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) alert(error.message);
    else alert('Check your email for confirmation before logging in.');
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>Flick Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20 }}
      />

      <TouchableOpacity
        onPress={signIn}
        style={{ backgroundColor: '#FF6F3C', padding: 12, borderRadius: 8, marginBottom: 10 }}
      >
        <Text style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>
          {loading ? '...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={{ color: '#FF6F3C', textAlign: 'center', marginTop: 10 }}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={signUp} style={{ padding: 12 }}>
        <Text style={{ textAlign: 'center', color: '#FF6F3C' }}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}
