import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { colors } from '../theme';
import { API_URL, authHeaders } from '../config';
// Plan is auto-saved to MongoDB by the backend — no local storage calls needed
import type { TrainingPlan, UserProfile, ConversationMessage } from '../types/plan';

const MESSAGES = [
  'Analyzing your profile...',
  'Designing your first week...',
  'Programming your second week...',
  'Calibrating loads and progressions...',
  'Finalizing your plan...',
];

interface Props {
  token: string;
  userProfile: UserProfile;
  conversationHistory: ConversationMessage[];
  onComplete: (plan: TrainingPlan) => void;
  onError: (message: string) => void;
}

export default function GeneratingScreen({ token, userProfile, conversationHistory, onComplete, onError }: Props) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Cycle status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex(i => (i < MESSAGES.length - 1 ? i + 1 : i));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Generate plan
  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const res = await fetch(`${API_URL}/api/plan/generate`, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify({ userProfile, conversationHistory }),
        });

        const data = await res.json();
        if (cancelled) return;

        if (data.error || !data.plan) throw new Error(data.error ?? 'No plan returned');

        const plan: TrainingPlan = data.plan;
        onComplete(plan);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message ?? 'Something went wrong');
          onError(err.message ?? 'Something went wrong');
        }
      }
    }

    generate();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.errorTitle}>Couldn't generate plan</Text>
          <Text style={s.errorMsg}>{error}</Text>
          <Text style={s.errorHint}>Make sure your Mac's backend is running, then try again.</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => {
            setError(null);
            setStatusIndex(0);
          }}>
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Animated.View style={[s.logo, { opacity: pulseAnim }]}>
          <View style={s.logoDot} />
          <Text style={s.logoText}>APEX</Text>
        </Animated.View>

        <Text style={s.title}>Building your plan</Text>
        <Text style={s.status}>{MESSAGES[statusIndex]}</Text>

        <View style={s.dotsRow}>
          {MESSAGES.map((_, i) => (
            <View key={i} style={[s.dot, i <= statusIndex && s.dotActive]} />
          ))}
        </View>

        <Text style={s.hint}>This takes about 20 seconds</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 48 },
  logoDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent },
  logoText: { color: colors.accent, fontSize: 28, fontWeight: '800', letterSpacing: 6 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  status: { color: colors.muted, fontSize: 15, marginBottom: 32, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.accent },
  hint: { color: colors.muted, fontSize: 13 },
  errorTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  errorMsg: { color: '#ff6b6b', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  errorHint: { color: colors.muted, fontSize: 13, marginBottom: 32, textAlign: 'center' },
  retryBtn: {
    backgroundColor: colors.accent, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 24,
  },
  retryText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
});
