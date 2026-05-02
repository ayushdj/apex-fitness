import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { colors } from '../theme';
import { streamChat } from '../services/chatService';
import type { UserProfile, ConversationMessage } from '../types/plan';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
}

interface Props {
  token: string;
  onComplete: (profile: UserProfile, history: ConversationMessage[]) => void;
}

// ── Quick Setup options ───────────────────────────────────────────────────────

const GOALS = ['Build muscle', 'Lose fat', 'Improve endurance', 'General fitness', 'Athletic performance'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const DAYS = ['3 days', '4 days', '5 days', '6 days'];
const EQUIPMENT = ['Full gym', 'Home gym (dumbbells/bands)', 'No equipment (bodyweight only)'];
const DIETS = ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Other'];

function Chip({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[q.chip, selected && q.chipSelected]}
      onPress={onPress}
    >
      <Text style={[q.chipText, selected && q.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Quick Setup form ──────────────────────────────────────────────────────────

function QuickSetup({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [days, setDays] = useState('');
  const [equipment, setEquipment] = useState('');
  const [diet, setDiet] = useState('');
  const [injuries, setInjuries] = useState('');

  const ready = goal && level && days && equipment && diet;

  const submit = () => {
    const profile: UserProfile = {
      athleteIdentity: `${level} athlete focused on ${goal.toLowerCase()}`,
      goals: goal,
      schedule: `${days} per week, ${equipment}`,
      injuries: injuries.trim() || 'None',
      diet,
      nutrition: diet,
    };
    onComplete(profile);
  };

  return (
    <ScrollView style={q.scroll} contentContainerStyle={q.content} keyboardShouldPersistTaps="handled">
      <Text style={q.sectionLabel}>GOAL</Text>
      <View style={q.chips}>
        {GOALS.map(g => <Chip key={g} label={g} selected={goal === g} onPress={() => setGoal(g)} />)}
      </View>

      <Text style={q.sectionLabel}>EXPERIENCE LEVEL</Text>
      <View style={q.chips}>
        {LEVELS.map(l => <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />)}
      </View>

      <Text style={q.sectionLabel}>DAYS PER WEEK</Text>
      <View style={q.chips}>
        {DAYS.map(d => <Chip key={d} label={d} selected={days === d} onPress={() => setDays(d)} />)}
      </View>

      <Text style={q.sectionLabel}>EQUIPMENT</Text>
      <View style={q.chips}>
        {EQUIPMENT.map(e => <Chip key={e} label={e} selected={equipment === e} onPress={() => setEquipment(e)} />)}
      </View>

      <Text style={q.sectionLabel}>DIET</Text>
      <View style={q.chips}>
        {DIETS.map(d => <Chip key={d} label={d} selected={diet === d} onPress={() => setDiet(d)} />)}
      </View>

      <Text style={q.sectionLabel}>INJURIES OR LIMITATIONS <Text style={q.optional}>(optional)</Text></Text>
      <TextInput
        style={q.textInput}
        value={injuries}
        onChangeText={setInjuries}
        placeholder="e.g. bad knees, lower back pain, none"
        placeholderTextColor={colors.muted}
        multiline
      />

      <TouchableOpacity
        style={[q.submitBtn, !ready && q.submitBtnDisabled]}
        onPress={submit}
        disabled={!ready}
      >
        <Text style={q.submitBtnText}>Generate My Plan →</Text>
      </TouchableOpacity>

      <Text style={q.creditNote}>No AI credits used for setup — only for plan generation</Text>
    </ScrollView>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen({ token, onComplete }: Props) {
  const [mode, setMode] = useState<'choose' | 'chat' | 'quick'>('choose');

  const handleQuickComplete = (profile: UserProfile) => {
    onComplete(profile, []);
  };

  if (mode === 'choose') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <View style={s.chooseContainer}>
          <View style={s.logoRow}>
            <View style={s.logoDot} />
            <Text style={s.logoText}>APEX</Text>
          </View>
          <Text style={s.chooseTitle}>Set up your plan</Text>
          <Text style={s.chooseSubtitle}>Choose how you'd like to get started</Text>

          <TouchableOpacity style={s.modeCard} onPress={() => setMode('chat')}>
            <Text style={s.modeIcon}>💬</Text>
            <View style={s.modeInfo}>
              <Text style={s.modeName}>Chat with APEX</Text>
              <Text style={s.modeDesc}>Answer 4 questions in a conversation. Gets you a more personalised plan.</Text>
              <Text style={s.modeCost}>Uses ~$0.01 in credits</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.modeCard} onPress={() => setMode('quick')}>
            <Text style={s.modeIcon}>⚡</Text>
            <View style={s.modeInfo}>
              <Text style={s.modeName}>Quick Setup</Text>
              <Text style={s.modeDesc}>Pick your goal, schedule, and equipment. Ready in seconds.</Text>
              <Text style={[s.modeCost, s.modeCostFree]}>No credits used for setup</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'quick') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <View style={s.header}>
          <TouchableOpacity onPress={() => setMode('choose')} style={s.backBtn}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={s.logoRow}>
            <View style={s.logoDot} />
            <Text style={s.logoText}>APEX</Text>
          </View>
          <Text style={s.headerSub}>Quick Setup</Text>
        </View>
        <QuickSetup onComplete={handleQuickComplete} />
      </SafeAreaView>
    );
  }

  // Chat mode
  return <ChatOnboarding token={token} onComplete={onComplete} onBack={() => setMode('choose')} />;
}

// ── Chat onboarding ───────────────────────────────────────────────────────────

function ChatOnboarding({
  token,
  onComplete,
  onBack,
}: {
  token: string;
  onComplete: (profile: UserProfile, history: ConversationMessage[]) => void;
  onBack: () => void;
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

    let fullText = '';

    await streamChat({
      token,
      messages: historyRef.current,
      userProfile: updatedProfile,
      onToken: (chunk) => {
        fullText += chunk;
        setMessages(prev =>
          prev.map(m => m.id === aiId ? { ...m, text: fullText } : m)
        );
      },
      onDone: () => {
        historyRef.current = [...historyRef.current, { role: 'assistant', content: fullText }];
        setLoading(false);
        if (newTurn >= 4) {
          setTimeout(() => onComplete(updatedProfile, historyRef.current), 2500);
        }
      },
      onError: (err) => {
        setMessages(prev =>
          prev.map(m => m.id === aiId ? { ...m, text: `Error: ${err}` } : m)
        );
        setLoading(false);
      },
    });
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
          <Text style={[s.bubbleText, item.role === 'user' && s.userBubbleText]}>{item.text}</Text>
        ) : (
          <ActivityIndicator size="small" color={colors.accent} />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={s.logoRow}>
            <View style={s.logoDot} />
            <Text style={s.logoText}>APEX</Text>
          </View>
          <Text style={s.headerSub}>AI Fitness Coach · Powered by Claude</Text>
        </View>

        <View style={s.progressRow}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[s.dot, turnCount > i && s.dotActive]} />
          ))}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={s.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          style={s.flex}
        />

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

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: { padding: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { marginBottom: 8 },
  backBtnText: { color: colors.muted, fontSize: 14 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  logoDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  logoText: { color: colors.accent, fontSize: 20, fontWeight: '800', letterSpacing: 4 },
  headerSub: { color: colors.muted, fontSize: 11 },

  // Choose mode screen
  chooseContainer: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  chooseTitle: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 24, marginBottom: 4 },
  chooseSubtitle: { color: colors.muted, fontSize: 15, marginBottom: 16 },
  modeCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    backgroundColor: colors.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  modeIcon: { fontSize: 28, marginTop: 2 },
  modeInfo: { flex: 1, gap: 4 },
  modeName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  modeDesc: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  modeCost: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 4 },
  modeCostFree: { color: colors.accent },

  // Chat
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
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.3 },
  sendBtnText: { color: colors.bg, fontSize: 20, fontWeight: '800' },
});

const q = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, gap: 10, paddingBottom: 40 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 8 },
  optional: { color: colors.muted, fontWeight: '400', fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: colors.bg },
  textInput: {
    backgroundColor: colors.surface, color: colors.text, borderWidth: 1,
    borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15,
    minHeight: 60,
  },
  submitBtn: {
    backgroundColor: colors.accent, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  creditNote: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
