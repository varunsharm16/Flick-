import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface CoachSheetProps {
  visible: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
}

const CoachSheet: React.FC<CoachSheetProps> = ({
  visible,
  onClose,
  messages,
  input,
  onInputChange,
  onSend,
  sending
}) => {
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : Dimensions.get('window').width,
      duration: 250,
      useNativeDriver: true
    }).start();
  }, [visible, slideAnim]);

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Coach</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            style={styles.messageList}
            contentContainerStyle={{ paddingBottom: 16 }}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.role === 'assistant' ? styles.assistantBubble : styles.userBubble
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.role === 'assistant' ? styles.assistantText : styles.userText
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            )}
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Ask your AI coach..."
                placeholderTextColor="#9e9ea7"
                value={input}
                onChangeText={onInputChange}
                editable={!sending}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input || sending) && styles.sendDisabled]}
                onPress={onSend}
                disabled={!input || sending}
              >
                <Text style={styles.sendText}>{sending ? '...' : 'Send'}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  backdrop: {
    flex: 1
  },
  sheet: {
    width: '80%',
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowColor: '#00000020',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e'
  },
  close: {
    color: '#FF6F3C',
    fontWeight: '600'
  },
  messageList: {
    flex: 1
  },
  messageBubble: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    maxWidth: '85%'
  },
  assistantBubble: {
    backgroundColor: '#F5F5F8',
    alignSelf: 'flex-start'
  },
  userBubble: {
    backgroundColor: '#FF6F3C',
    alignSelf: 'flex-end'
  },
  messageText: {
    fontSize: 15
  },
  assistantText: {
    color: '#1f1f24'
  },
  userText: {
    color: '#fff'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f3',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15
  },
  sendBtn: {
    backgroundColor: '#FF6F3C',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999
  },
  sendDisabled: {
    backgroundColor: '#FFD2C2'
  },
  sendText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export type { ChatMessage };
export default CoachSheet;
