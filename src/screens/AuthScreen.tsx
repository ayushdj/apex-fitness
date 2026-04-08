import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
  ActivityIndicator, Image,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { colors } from '../theme';
import { API_URL } from '../config';

// Required for Google OAuth redirect to close the browser automatically
WebBrowser.maybeCompleteAuthSession();

// ─── Replace this with your Google Web Client ID from Google Cloud Console ───
const GOOGLE_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID';
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onAuthenticated: (token: string, user: { id: number; name: string; email: string; avatar?: string | null }) => void;
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Google OAuth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleToken(authentication.accessToken);
      }
    } else if (response?.type === 'error') {
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleToken = async (accessToken: string) => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Google sign-in failed');
      onAuthenticated(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const signInWithGoogle = () => {
    if (!request) {
      setError('Google sign-in is not configured yet. See setup instructions.');
      return;
    }
    setError('');
    setGoogleLoading(true);
    promptAsync();
  };

  const submit = async () => {
    setError('');
    if (mode === 'register' && !name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!password) { setError('Please enter your password'); return; }
    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'register'
            ? { name: name.trim(), email: email.trim(), password }
            : { email: email.trim(), password }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong');
      onAuthenticated(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoRow}>
            <View style={s.logoDot} />
            <Text style={s.logoText}>APEX</Text>
          </View>
          <Text style={s.tagline}>Your AI fitness coach</Text>

          {/* Google button */}
          <TouchableOpacity
            style={[s.googleBtn, (googleLoading || !request) && s.btnDisabled]}
            onPress={signInWithGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Text style={s.googleIcon}>G</Text>
                <Text style={s.googleText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Email/password card */}
          <View style={s.card}>
            <Text style={s.title}>
              {mode === 'register' ? 'Create account' : 'Sign in with email'}
            </Text>

            {mode === 'register' && (
              <View style={s.field}>
                <Text style={s.label}>Name</Text>
                <TextInput
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                placeholderTextColor={colors.muted}
                secureTextEntry
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={submit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={colors.bg} />
                : <Text style={s.btnText}>{mode === 'register' ? 'Create Account' : 'Sign In'}</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Toggle */}
          <TouchableOpacity
            style={s.toggleRow}
            onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          >
            <Text style={s.toggleText}>
              {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={s.toggleLink}>
                {mode === 'register' ? 'Sign in' : 'Create one'}
              </Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, justifyContent: 'center' },
  logoDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
  logoText: { color: colors.accent, fontSize: 26, fontWeight: '800', letterSpacing: 5 },
  tagline: { color: colors.muted, fontSize: 13, textAlign: 'center', marginBottom: 32 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingVertical: 15, marginBottom: 24,
  },
  googleIcon: { color: '#4285F4', fontSize: 18, fontWeight: '800' },
  googleText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.muted, fontSize: 13 },
  card: {
    backgroundColor: colors.surface, borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 20,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: colors.bg, color: colors.text, borderWidth: 1,
    borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15,
  },
  error: { color: '#ff6b6b', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: {
    backgroundColor: colors.accent, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  toggleRow: { alignItems: 'center' },
  toggleText: { color: colors.muted, fontSize: 14 },
  toggleLink: { color: colors.accent, fontWeight: '600' },
});
