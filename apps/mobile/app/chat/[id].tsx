import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/auth';
import { useAppTheme } from '../../constants/app-theme';

export default function ChatScreen() {
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(22);
  const insets = useSafeAreaInsets();
  const { token, profile } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  const load = async () => {
    if (!id) return;
    const list = await api.getChat(String(id));
    setMessages(list as any[]);
  };

  useEffect(() => {
    load().catch(console.warn);
  }, [id]);

  useEffect(() => {
    if (!id || !token) return;
    const socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;
    socket.emit('join', { instanceId: String(id) });
    socket.on('message', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.disconnect();
    };
  }, [id, token]);

  const send = async () => {
    try {
      if (!text.trim()) return;
      if (socketRef.current) {
        socketRef.current.emit('message', { instanceId: String(id), text: text.trim() });
      } else {
        const msg = await api.sendChat(String(id), text.trim());
        setMessages((prev) => [...prev, msg]);
      }
      setText('');
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.screen }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Quest Chat</Text>
      </View>
      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: 16 + 96 + 24 + insets.bottom,
          },
        ]}>
        {messages.map((m) => {
          const isOwnMessage = m.userId === profile?.id;
          return (
          <View
            key={m.id}
            style={[
              styles.messageRow,
              isOwnMessage ? styles.messageRowOwn : styles.messageRowOther,
            ]}>
            <View
              style={[
                styles.message,
                isOwnMessage
                  ? { backgroundColor: colors.success, borderColor: colors.success }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
            <View style={[styles.messageHeader, isOwnMessage && styles.messageHeaderOwn]}>
              <Text style={[styles.messageAuthor, { color: colors.textMuted }]}>
                {m.user?.alias || 'Member'}
              </Text>
              {m.isHost && (
                <View style={[styles.hostBadge, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
                  <Text style={[styles.hostBadgeText, { color: colors.primary }]}>HOST</Text>
                </View>
              )}
            </View>
            <Text style={[styles.messageText, { color: colors.text }]}>
              {m.text}
            </Text>
            </View>
          </View>
        )})}
      </ScrollView>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.screen,
            paddingBottom: 8 + insets.bottom,
          },
        ]}>
        <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                height: Math.min(Math.max(44, inputHeight + 20), 120),
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSoft}
            multiline
            textAlignVertical="top"
            onContentSizeChange={(event) => setInputHeight(event.nativeEvent.contentSize.height)}
          />
          <Pressable
            style={[styles.sendButton, { backgroundColor: colors.success }]}
            onPress={send}>
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { backgroundColor: '#FFF', padding: 8, borderRadius: 999, borderWidth: 1, borderColor: '#F0E6DE' },
  title: { fontSize: 16, fontWeight: '700', color: '#3C2F25' },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  messageRow: { width: '100%' },
  messageRowOwn: { alignItems: 'flex-end' },
  messageRowOther: { alignItems: 'flex-start' },
  message: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  messageHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  messageHeaderOwn: { justifyContent: 'flex-end' },
  messageAuthor: { fontSize: 11, color: '#8B7E74', marginBottom: 4 },
  hostBadge: {
    backgroundColor: '#FFF1E8',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#F0E6DE',
  },
  hostBadgeText: { color: '#E56A3C', fontSize: 10, fontWeight: '700' },
  messageText: { color: '#3C2F25', fontSize: 16, lineHeight: 22, flexWrap: 'wrap' },
  inputRow: { paddingHorizontal: 12, paddingTop: 12 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderWidth: 1,
    borderRadius: 26,
    paddingLeft: 14,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingTop: 2,
    paddingBottom: 2,
    paddingRight: 8,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
