import React, { useEffect, useMemo, useRef } from 'react';
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
  View,
} from 'react-native';

import { AppTheme, AppThemeColors, useAppTheme } from '@/hooks/useAppTheme';

export interface ChatMessage {
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

const createStyles = (colors: AppThemeColors, spacing: AppTheme['spacing'], typography: AppTheme['typography']) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: colors.overlay,
    },
    backdrop: {
      flex: 1,
    },
    sheet: {
      width: '80%',
      backgroundColor: colors.surface,
      paddingTop: spacing.section * 1.5,
      paddingHorizontal: spacing.section,
      paddingBottom: spacing.section,
      borderTopLeftRadius: spacing.cardRadius + 8,
      borderBottomLeftRadius: spacing.cardRadius + 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#00000030',
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.itemGap,
    },
    headerTitle: {
      fontSize: typography.subtitle,
      fontWeight: '700',
      color: colors.text,
    },
    close: {
      color: colors.accent,
      fontWeight: '600',
    },
    messageList: {
      flex: 1,
    },
    messageBubble: {
      borderRadius: spacing.cardRadius,
      padding: spacing.itemGap,
      marginBottom: spacing.itemGap,
      maxWidth: '85%',
    },
    assistantBubble: {
      backgroundColor: colors.surfaceElevated,
      alignSelf: 'flex-start',
    },
    userBubble: {
      backgroundColor: colors.accent,
      alignSelf: 'flex-end',
    },
    messageText: {
      fontSize: typography.body,
    },
    assistantText: {
      color: colors.text,
    },
    userText: {
      color: '#fff',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.itemGap / 2,
      marginTop: spacing.itemGap,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 999,
      paddingHorizontal: spacing.section,
      paddingVertical: 12,
      fontSize: typography.body,
      color: colors.text,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sendBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.itemGap * 1.6,
      paddingVertical: 12,
      borderRadius: 999,
    },
    sendDisabled: {
      backgroundColor: colors.accentSoft,
    },
    sendText: {
      color: '#fff',
      fontWeight: '600',
    },
  });

const CoachSheet: React.FC<CoachSheetProps> = ({
  visible,
  onClose,
  messages,
  input,
  onInputChange,
  onSend,
  sending,
}) => {
  const { colors, spacing, typography } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, spacing, typography), [colors, spacing, typography]);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : Dimensions.get('window').width,
      duration: 250,
      useNativeDriver: true,
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
            contentContainerStyle={{ paddingBottom: spacing.itemGap }}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.role === 'assistant' ? styles.assistantBubble : styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.role === 'assistant' ? styles.assistantText : styles.userText,
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
                placeholderTextColor={colors.muted}
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

export default CoachSheet;
