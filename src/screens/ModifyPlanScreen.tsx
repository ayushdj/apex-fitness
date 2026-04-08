import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, StatusBar,
} from 'react-native';
import { colors } from '../theme';
import { API_URL, authHeaders } from '../config';
import type { TrainingPlan, UserProfile, ConversationMessage } from '../types/plan';

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

function buildPlanContext(plan: TrainingPlan): string {
  const weekSummaries = plan.weeks?.map(w => {
    const days = w.days?.map(d => `${d.dayOfWeek}: ${d.name} (${d.type})`).join(', ');
    return `Week ${w.weekNumber} — ${w.theme ?? w.label ?? ''}: ${days}`;
  }).join('\n');

  return `Plan: ${plan.planName ?? 'Custom Plan'}
Goal: ${plan.goal ?? 'Not specified'}
Program summary: ${plan.programSummary ?? ''}

Weekly structure:
${weekSummaries ?? 'No weeks defined'}`;
}

export default function ModifyPlanScreen({
  token,
  plan,
  onComplete,
  onCancel,
}: {
  token: string;
  plan: TrainingPlan;
  onComplete: (profile: UserProfile, history: ConversationMessage[]) => void;
  onCancel: () => void;
}) {
  const planContext = buildPlanContext(plan);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: `I can see your current plan: ${plan.planName ?? 'your training plan'}. What's changed? Tell me about any schedule shifts, new commitments, updated goals, or anything else you'd like to adjust.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const historyRef = useRef<ConversationMessage[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const profileRef = useRef<UserProfile>({
    athleteIdentity: plan.goal ?? '',
    goals: plan.goal ?? '',
  });

  const canUpdate = exchangeCount >= 1 && !loading;

  const send = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    historyRef.current = [...historyRef.current, { role: 'user', content: userText }];

    const aiId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '' }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/complete`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          messages: historyRef.current,
          userProfile: profileRef.current,
          planContext,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, text: 'You have run out of credits. Please top up to continue.' } : m
        ));
        return;
      }

      if (!res.ok || data.error) throw new Error(data.message ?? data.error ?? 'Server error');

      const aiText: string = data.text;
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: aiText } : m));
      historyRef.current = [...historyRef.current, { role: 'assistant', content: aiText }];
      setExchangeCount(c => c + 1);

      // Extract any schedule/goal changes the user mentioned
      profileRef.current = {
        ...profileRef.current,
        modifications: userText,
      };
    } catch (err: any) {
      setMessages(prev => prev.map(m =>
        m.id === aiId ? { ...m, text: `Error: ${err.message}` } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    // Include current plan context so GeneratingScreen can build on it
    const mergedProfile: UserProfile = {
      ...profileRef.current,
      planContext,
      modifications: historyRef.current
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n'),
    };
    onComplete(mergedProfile, historyRef.current);
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
          <View style={s.headerRow}>
            <TouchableOpacity onPress={onCancel} style={s.backBtn}>
              <Text style={s.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={s.logoRow}>
              <View style={s.logoDot} />
              <Text style={s.logoText}>APEX</Text>
            </View>
            <TouchableOpacity
              style={[s.updateBtn, !canUpdate && s.updateBtnDisabled]}
              onPress={canUpdate ? handleUpdate : undefined}
            >
              <Text style={[s.updateBtnText, !canUpdate && s.updateBtnTextDisabled]}>
                Update Plan
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={s.headerSub}>Tell APEX what's changed in your life</Text>
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
            placeholder="What's changed?"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            editable={!loading}
            onSubmitEditing={send}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[s.sendBtn, (loading || !input.trim()) && s.sendBtnDisabled]}
            onPress={send}
            disabled={loading || !input.trim()}
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  logoText: { color: colors.accent, fontSize: 16, fontWeight: '800', letterSpacing: 3 },
  headerSub: { color: colors.muted, fontSize: 11, textAlign: 'center' },
  updateBtn: {
    backgroundColor: colors.accent, borderRadius: 10,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  updateBtnDisabled: { backgroundColor: colors.border },
  updateBtnText: { color: colors.bg, fontSize: 12, fontWeight: '700' },
  updateBtnTextDisabled: { color: colors.muted },
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
