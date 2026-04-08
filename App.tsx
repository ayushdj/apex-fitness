import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/theme';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import GeneratingScreen from './src/screens/GeneratingScreen';
import TodayScreen from './src/screens/TodayScreen';
import PlanScreen from './src/screens/PlanScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import { loadPlan, loadAuth, saveAuth, clearAuth } from './src/storage/planStorage';
import type { TrainingPlan, UserProfile, ConversationMessage } from './src/types/plan';

type Screen = 'loading' | 'auth' | 'onboarding' | 'generating' | 'main';
type Tab = 'today' | 'plan' | 'progress' | 'profile';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '⚡' },
  { id: 'plan', label: 'Plan', icon: '📋' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [tab, setTab] = useState<Tab>('today');
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [token, setToken] = useState('');
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);

  // On startup: check for saved auth token + plan
  useEffect(() => {
    async function bootstrap() {
      const auth = await loadAuth();
      if (!auth) { setScreen('auth'); return; }

      setToken(auth.token);
      setUser(auth.user);

      const existing = await loadPlan(auth.token);
      if (existing) {
        setPlan(existing);
        setScreen('main');
      } else {
        setScreen('onboarding');
      }
    }
    bootstrap();
  }, []);

  const handleAuthenticated = async (
    newToken: string,
    newUser: { id: string; name: string; email: string }
  ) => {
    await saveAuth(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    const existing = await loadPlan(newToken);
    if (existing) {
      setPlan(existing);
      setScreen('main');
    } else {
      setScreen('onboarding');
    }
  };

  const handleOnboardingComplete = (profile: UserProfile, history: ConversationMessage[]) => {
    setUserProfile(profile);
    setConversationHistory(history);
    setScreen('generating');
  };

  const handlePlanGenerated = (generatedPlan: TrainingPlan) => {
    setPlan(generatedPlan);
    setScreen('main');
  };

  const handleSignOut = async () => {
    await clearAuth();       // clears token from AsyncStorage
    setToken('');            // plan stays in MongoDB — loads again on next login
    setUser(null);
    setPlan(null);
    setScreen('auth');
  };

  if (screen === 'loading') return null;

  if (screen === 'auth') {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </>
    );
  }

  if (screen === 'onboarding') {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen token={token} onComplete={handleOnboardingComplete} />
      </>
    );
  }

  if (screen === 'generating') {
    return (
      <>
        <StatusBar style="light" />
        <GeneratingScreen
          token={token}
          userProfile={userProfile}
          conversationHistory={conversationHistory}
          onComplete={handlePlanGenerated}
          onError={(msg) => console.error('Plan generation failed:', msg)}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style="light" />
      <View style={s.content}>
        {tab === 'today' && <TodayScreen plan={plan} token={token} />}
        {tab === 'plan' && <PlanScreen plan={plan} token={token} />}
        {tab === 'progress' && <ProgressScreen />}
        {tab === 'profile' && <ProfileTab user={user} onSignOut={handleSignOut} />}
      </View>
      <View style={s.tabBar}>
        {tabs.map(t => (
          <TouchableOpacity key={t.id} style={s.tab} onPress={() => setTab(t.id)}>
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabLabel, tab === t.id && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function ProfileTab({
  user,
  onSignOut,
}: {
  user: { id: string; name: string; email: string } | null;
  onSignOut: () => void;
}) {
  return (
    <View style={p.container}>
      {/* Avatar */}
      <View style={p.avatarCircle}>
        <Text style={p.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <Text style={p.name}>{user?.name}</Text>
      <Text style={p.email}>{user?.email}</Text>

      {/* Sign out */}
      <TouchableOpacity style={p.signOutBtn} onPress={onSignOut}>
        <Text style={p.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const p = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { color: colors.bg, fontSize: 32, fontWeight: '800' },
  name: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  email: { color: colors.muted, fontSize: 14, marginBottom: 48 },
  signOutBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 48,
  },
  signOutText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingBottom: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2 },
  tabIcon: { fontSize: 20 },
  tabLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  tabLabelActive: { color: colors.accent },
});
