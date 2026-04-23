import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { colors } from '../theme';
import { API_URL } from '../config';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID';

interface Props {
  onAuthenticated: (token: string, user: { id: string; name: string; email: string; avatar?: string | null }) => void;
}

type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'success';

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) handleGoogleToken(authentication.accessToken);
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
    if (!request) { setError('Google sign-in is not configured yet.'); return; }
    setError('');
    setGoogleLoading(true);
    promptAsync();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  // ─── Login / Register ────────────────────────────────────────────────────────
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
      if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Something went wrong');
      onAuthenticated(data.token, data.user);
    } catch (err: any) {
      console.error('[AuthScreen] login/register failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot password — step 1: request token ────────────────────────────────
  const submitForgot = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Something went wrong');

      // Backend returns token directly (until email is wired up)
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setInfo('A reset token has been generated. Enter it below with your new password.');
        setMode('reset');
      } else {
        setInfo(data.message ?? 'Check your email for a reset link.');
        setMode('reset');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot password — step 2: set new password ──────────────────────────────
  const submitReset = async () => {
    setError('');
    if (!resetToken.trim()) { setError('Please enter your reset token'); return; }
    if (!newPassword) { setError('Please enter a new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken: resetToken.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Something went wrong');
      setMode('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const renderHeader = () => (
    <>
      <View style={s.logoRow}>
        <View style={s.logoDot} />
        <Text style={s.logoText}>APEX</Text>
      </View>
      <Text style={s.tagline}>Your AI fitness coach</Text>
    </>
  );

  // ─── Forgot: step 1 ──────────────────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            {renderHeader()}
            <View style={s.card}>
              <Text style={s.title}>Reset password</Text>
              <Text style={s.description}>
                Enter your account email and we'll generate a reset token for you.
              </Text>
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
              {error ? <Text style={s.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={submitForgot}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={colors.bg} />
                  : <Text style={s.btnText}>Get Reset Token</Text>
                }
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.toggleRow} onPress={() => switchMode('login')}>
              <Text style={s.toggleText}>
                Remember it? <Text style={s.toggleLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Forgot: step 2 ──────────────────────────────────────────────────────────
  if (mode === 'reset') {
    return (
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            {renderHeader()}
            <View style={s.card}>
              <Text style={s.title}>Set new password</Text>
              {info ? <Text style={s.infoText}>{info}</Text> : null}

              <View style={s.field}>
                <Text style={s.label}>Reset Token</Text>
                <TextInput
                  style={s.input}
                  value={resetToken}
                  onChangeText={setResetToken}
                  placeholder="Paste your reset token"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={s.field}>
                <Text style={s.label}>New Password</Text>
                <TextInput
                  style={s.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                />
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={submitReset}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={colors.bg} />
                  : <Text style={s.btnText}>Reset Password</Text>
                }
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.toggleRow} onPress={() => switchMode('forgot')}>
              <Text style={s.toggleText}>
                <Text style={s.toggleLink}>← Back</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Success ─────────────────────────────────────────────────────────────────
  if (mode === 'success') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.scroll}>
          {renderHeader()}
          <View style={s.card}>
            <Text style={[s.title, { textAlign: 'center' }]}>✓ Password reset</Text>
            <Text style={s.description}>
              Your password has been updated. Sign in with your new password.
            </Text>
            <TouchableOpacity style={s.btn} onPress={() => switchMode('login')}>
              <Text style={s.btnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Login / Register ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {renderHeader()}

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
              <View style={s.labelRow}>
                <Text style={s.label}>Password</Text>
                {mode === 'login' && (
                  <TouchableOpacity onPress={() => switchMode('forgot')}>
                    <Text style={s.forgotLink}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </View>
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
            onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
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
  title: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  field: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  forgotLink: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: colors.bg, color: colors.text, borderWidth: 1,
    borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15,
  },
  error: { color: '#ff6b6b', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  infoText: { color: colors.muted, fontSize: 13, marginBottom: 16, lineHeight: 18 },
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
