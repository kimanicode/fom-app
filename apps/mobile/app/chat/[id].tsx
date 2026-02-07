import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { api } from '../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../../store/auth';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
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
    if (!text.trim()) return;
    if (socketRef.current) {
      socketRef.current.emit('message', { instanceId: String(id), text: text.trim() });
    } else {
      const msg = await api.sendChat(String(id), text.trim());
      setMessages((prev) => [...prev, msg]);
    }
    setText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={18} color="#3C2F25" />
        </Pressable>
        <Text style={styles.title}>Quest Chat</Text>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {messages.map((m) => (
          <View key={m.id} style={styles.message}>
            <Text style={styles.messageAuthor}>{m.user?.alias || 'Member'}</Text>
            <Text style={styles.messageText}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Say something..."
          placeholderTextColor="#9A8E86"
        />
        <Pressable style={styles.sendButton} onPress={send}>
          <Ionicons name="send" size={16} color="#FFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F2' },
  header: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { backgroundColor: '#FFF', padding: 8, borderRadius: 999, borderWidth: 1, borderColor: '#F0E6DE' },
  title: { fontSize: 16, fontWeight: '700', color: '#3C2F25' },
  list: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  message: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F0E6DE' },
  messageAuthor: { fontSize: 11, color: '#8B7E74', marginBottom: 4 },
  messageText: { color: '#3C2F25' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderColor: '#EFE4DA' },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#EFE4DA' },
  sendButton: { backgroundColor: '#3C2F25', padding: 12, borderRadius: 12 },
});
