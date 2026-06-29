import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokenStorage } from '../../services/api';

const API_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AgentTab() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#0f0f23' : '#f8fafc';
  const card = isDark ? '#1e2640' : '#fff';
  const text = isDark ? '#f1f5f9' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setIsStreaming(true);

    try {
      const token = await tokenStorage.getAccess();
      const res = await fetch(`${API_URL}/agent/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ message: text, conversationId }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6)) as Record<string, unknown>;
              if (json['type'] === 'text_delta') {
                accumulated += (json['text'] as string) ?? '';
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m)
                );
              } else if (json['type'] === 'conversation_id') {
                setConversationId(json['conversationId'] as string);
              }
            } catch { /* partial chunk */ }
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: t('agent.error') } : m)
      );
    } finally {
      setIsStreaming(false);
    }
  }

  const QUICK_PROMPTS = [
    t('agent.quick1'),
    t('agent.quick2'),
    t('agent.quick3'),
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.agentIcon}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </LinearGradient>
        <View>
          <Text style={[styles.headerTitle, { color: text }]}>{t('agent.title')}</Text>
          <Text style={[styles.headerSub, { color: muted }]}>{t('agent.subtitle')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex} keyboardVerticalOffset={insets.bottom + 80}>
        {messages.length === 0 ? (
          <View style={styles.welcome}>
            <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.welcomeIcon}>
              <Ionicons name="sparkles" size={32} color="#fff" />
            </LinearGradient>
            <Text style={[styles.welcomeTitle, { color: text }]}>{t('agent.welcome_title')}</Text>
            <Text style={[styles.welcomeSub, { color: muted }]}>{t('agent.welcome_sub')}</Text>
            <View style={styles.quickPrompts}>
              {QUICK_PROMPTS.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.quickBtn, { backgroundColor: card }]}
                  onPress={() => { setInput(prompt); }}
                >
                  <Text style={[styles.quickText, { color: text }]}>{prompt}</Text>
                  <Ionicons name="arrow-forward" size={14} color={muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
                {item.role === 'assistant' && (
                  <LinearGradient colors={['#7c3aed', '#2563eb']} style={styles.aIcon}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                  </LinearGradient>
                )}
                <View style={[styles.bubbleContent, { backgroundColor: item.role === 'user' ? '#7c3aed' : card }]}>
                  {item.content ? (
                    <Text style={[styles.bubbleText, { color: item.role === 'user' ? '#fff' : text }]}>{item.content}</Text>
                  ) : (
                    <ActivityIndicator size="small" color="#7c3aed" />
                  )}
                </View>
              </View>
            )}
          />
        )}

        {/* Input */}
        <View style={[styles.inputArea, { backgroundColor: card, paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={[styles.textInput, { color: text }]}
            value={input}
            onChangeText={setInput}
            placeholder={t('agent.placeholder')}
            placeholderTextColor={muted}
            multiline
            maxLength={2000}
            onSubmitEditing={() => void sendMessage()}
          />
          <TouchableOpacity
            onPress={() => void sendMessage()}
            disabled={isStreaming || !input.trim()}
            style={styles.sendBtn}
          >
            <LinearGradient
              colors={isStreaming || !input.trim() ? ['#475569', '#475569'] : ['#7c3aed', '#2563eb']}
              style={styles.sendGradient}
            >
              {isStreaming ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 16 },
  agentIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12 },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  welcomeIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  welcomeSub: { fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  quickPrompts: { width: '100%', gap: 10 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, gap: 8 },
  quickText: { flex: 1, fontSize: 14 },
  messageList: { padding: 16, gap: 12 },
  bubble: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userBubble: { justifyContent: 'flex-end' },
  assistantBubble: { justifyContent: 'flex-start' },
  aIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubbleContent: { maxWidth: '80%', padding: 14, borderRadius: 16, minHeight: 40, justifyContent: 'center' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  inputArea: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1e2640' },
  textInput: { flex: 1, fontSize: 15, maxHeight: 120, paddingTop: 0 },
  sendBtn: { marginBottom: 2 },
  sendGradient: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
