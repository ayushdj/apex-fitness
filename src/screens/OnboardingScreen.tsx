import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, StatusBar,
} from 'react-native';
import { colors } from '../theme';
import { API_URL, authHeaders } from '../config';
import type { UserProfile, ConversationMessage } from '../types/plan';

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

export default function OnboardingScreen({
  token,
  onComplete,
}: {
  token: string;
  onComplete: (profile: UserProfile, history: ConversationMessage[]) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: "Hey! I'm APEX, your AI coach. Tell me — what kind of athlete do you want to become? No need for perfect answers, just describe yourself and your goals in your own words.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({});
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const isDone = turnCount >= 4;

  const send = async () => {
    if (!input.trim() || loading || isDone) return;

    const userText = input.trim();
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);

    historyRef.current = [...historyRef.current, { role: 'user', content: userText }];

    setLoading(true);
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);

    const updatedProfile = { ...profile };
    if (newTurn === 1) updatedProfile.athleteIdentity = userText;
    if (newTurn === 2) updatedProfile.schedule = userText;
    if (newTurn === 3) updatedProfile.injuries = userText;
    if (newTurn === 4) { updatedProfile.nutrition = userText; updatedProfile.diet = userText; }
    setProfile(updatedProfile);

    const aiId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '' }]);

    try {
      const res = await fetch(`${API_URL}/api/chat/complete`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ messages: historyRef.current, userProfile: updatedProfile }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const { text: aiText, error } = await res.json();
      if (error) throw new Error(error);

      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: aiText } : m));
      historyRef.current = [...historyRef.current, { role: 'assistant', content: aiText }];

      if (newTurn >= 4) {
        setTimeout(() => onComplete(updatedProfile, historyRef.current), 2500);
      }
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === aiId
            ? { ...m, text: `Error: ${err.message}. Make sure your Mac's backend is running.` }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={item.role === 'ai' ? s.aiRow : s.userRow}>
      {item.role === 'ai' && (
        <View style={s.avatar}>
          <Text style={s.avatarText}>A</Text>
        </View>
      )}
      <View style={[s.bubble, item.role === 'ai' ? s.aiBubble : s.userBubble]}>
        {item.text ? (
          <Text style={[s.bubbleText, item.role === 'user' && s.userBubbleText]}>
            {item.text}
          </Text>
        ) : (
          <ActivityIndicator size="small" color={colors.accent} />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.logoDot} />
            <Text style={s.logoText}>APEX</Text>
          </View>
          <Text style={s.headerSub}>AI Fitness Coach · Powered by Claude</Text>
        </View>

        {/* Progress dots */}
        <View style={s.progressRow}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[s.dot, turnCount > i && s.dotActive]} />
          ))}
        </View>

        {/* Chat */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={s.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          style={s.flex}
        />

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder={isDone ? 'Building your plan...' : 'Tell me about yourself...'}
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            editable={!loading && !isDone}
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[s.sendBtn, (loading || !input.trim() || isDone) && s.sendBtnDisabled]}
            onPress={send}
            disabled={loading || !input.trim() || isDone}
          >
            <Text style={s.sendBtnText}>{loading ? '…' : '↑'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  logoText: { color: colors.accent, fontSize: 20, fontWeight: '800', letterSpacing: 4 },
  headerSub: { color: colors.muted, fontSize: 11 },
  progressRow: { flexDirection: 'row', gap: 6, padding: 12, paddingHorizontal: 20 },
  dot: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent },
  chatContent: { padding: 16, gap: 12 },
  aiRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  userRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.bg, fontWeight: '800', fontSize: 14 },
  bubble: { maxWidth: '78%', borderRadius: 20, padding: 12, paddingHorizontal: 16 },
  aiBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  userBubble: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: colors.bg, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', gap: 8, padding: 12, paddingHorizontal: 16,
    borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end',
  },
  input: {
    flex: 1, backgroundColor: colors.surface, color: colors.text,
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.3 },
  sendBtnText: { color: colors.bg, fontSize: 20, fontWeight: '800' },
});
