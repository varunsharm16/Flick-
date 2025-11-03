import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const mockReplies = [
  "Soften your knees on the gather to load the shot. It keeps the release effortless.",
  "Picture the seams brushing your index finger last. That cue locks in rotation.",
  "Keep your follow-through high for one more beat. You're right at the sweet spot.",
  "Shift your weight off the heels sooner. The arc will jump immediately.",
];

type MessageRole = "user" | "assistant";

type Message = {
  id: string;
  role: MessageRole;
  text: string;
};

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Hey hooper! I'm Coach Flick. Drop a question about your mechanics or mindset and I'll break it down.",
  },
];

const CoachScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Message>>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages, isThinking]);

  const placeholder = useMemo(() => {
    const hints = [
      "Ask about your release",
      "How do I beat a shooting slump?",
      "What drill sharpens arc?",
    ];
    return hints[new Date().getSeconds() % hints.length];
  }, []);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      const reply = mockReplies[new Date().getMilliseconds() % mockReplies.length];
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);
    }, 1200);
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {!isUser && <Text style={styles.assistantLabel}>Coach Flick</Text>}
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 12 }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Coach Flick</Text>
        <Text style={styles.headerSubtitle}>Your AI shooting assistant</Text>
      </View>

      <LinearGradient colors={["#fdf2f8", "#f8fafc"]} style={styles.listGradient}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 20, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        />
        {isThinking && (
          <View style={styles.thinkingRow}>
            <View style={[styles.bubble, styles.assistantBubble]}>
              <Text style={styles.assistantLabel}>Coach Flick</Text>
              <View style={styles.thinkingDots}>
                <ActivityIndicator size="small" color="#fb7185" />
                <Text style={styles.thinkingText}>Thinking…</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        keyboardVerticalOffset={insets.bottom + 80}
      >
        <LinearGradient colors={["#ffffff", "#f8fafc"]} style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, input.trim() ? styles.sendButtonActive : null]}
            onPress={sendMessage}
            disabled={!input.trim() || isThinking}
          >
            <Ionicons name="send" size={20} color={input.trim() ? "#f8fafc" : "#cbd5f5"} />
          </TouchableOpacity>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Montserrat-Bold",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: "Montserrat-SemiBold",
    marginTop: 4,
  },
  listGradient: {
    flex: 1,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: "row",
  },
  messageRowAssistant: {
    justifyContent: "flex-start",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  assistantBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 6,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  userBubble: {
    backgroundColor: "#0f172a",
    borderBottomRightRadius: 6,
  },
  assistantLabel: {
    fontSize: 11,
    color: "#fb7185",
    fontFamily: "Montserrat-Bold",
    marginBottom: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Montserrat-SemiBold",
  },
  assistantText: {
    color: "#0f172a",
  },
  userText: {
    color: "#f8fafc",
  },
  thinkingRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  thinkingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  thinkingText: {
    fontSize: 13,
    color: "#fb7185",
    fontFamily: "Montserrat-SemiBold",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    fontSize: 15,
    fontFamily: "Montserrat-SemiBold",
    color: "#0f172a",
    paddingVertical: 6,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: "#fb7185",
    shadowColor: "#fb7185",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});

export default CoachScreen;
