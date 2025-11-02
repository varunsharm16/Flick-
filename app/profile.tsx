import React from 'react';
import { Alert, TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from './lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert('Logout failed', error.message);
      else router.replace('/Auth'); // 👈 navigates back to login screen
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong while logging out.');
    }
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Profile Screen</Text>
      <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: '#FF6F3C', padding: 10, borderRadius: 8 }}>
        <Ionicons name="log-out" size={20} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 4 }}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}
