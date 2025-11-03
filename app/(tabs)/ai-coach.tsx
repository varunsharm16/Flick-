import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

import { api } from '../../api/client';
import { useSession } from '../../store/useSession';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export default function AICoachScreen() {
  const insets = useSafeAreaInsets();
  const { name } = useSession();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'opening',
      role: 'assistant',
      text: 'Hey there! I’m your AI coach. Tell me how the last session felt and we’ll dial in your next adjustments.',
    },
  ]);

  const coachMutation = useMutation({
    mutationFn: (prompt: string) => api.coach(prompt),
    onSuccess: (data) => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: data.reply,
        },
      ]);
    },
    onError: () => {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: 'I lost the ball for a second—mind asking that again?',
        },
      ]);
    },
  });

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const outgoing: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((current) => [...current, outgoing]);
    setInput('');
    coachMutation.mutate(`${name} says: ${trimmed}`);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 12 }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your AI Coach</Text>
          <Text style={styles.subtitle}>Reflect on your reps. I’ll send adjustments you can feel.</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.assistantRow]}>
              <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.assistantText]}>
                  {item.text}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask for a drill, feedback, or next steps…"
              placeholderTextColor="rgba(148, 163, 184, 0.8)"
              style={styles.input}
              multiline
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]}
            onPress={sendMessage}
            disabled={coachMutation.isPending}
          >
            {coachMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={22} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#FF3B30',
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
    fontWeight: '600',
  },
  assistantText: {
    color: '#E2E8F0',
  },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    color: '#F8FAFC',
    fontSize: 15,
    lineHeight: 20,
    maxHeight: 110,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonPressed: {
    opacity: 0.85,
  },
});
