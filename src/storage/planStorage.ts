import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrainingPlan, PlanProgress } from '../types/plan';
import { API_URL, authHeaders } from '../config';

const TOKEN_KEY = 'apex_auth_token';
const USER_KEY  = 'apex_auth_user';

// ── Auth (stays in AsyncStorage — just a token) ───────────────────────

export async function saveAuth(token: string, user: { id: string; name: string; email: string }): Promise<void> {
  await AsyncStorage.multiSet([[TOKEN_KEY, token], [USER_KEY, JSON.stringify(user)]]);
}

export async function loadAuth(): Promise<{ token: string; user: { id: string; name: string; email: string } } | null> {
  const [[, token], [, userRaw]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
  if (!token || !userRaw) return null;
  return { token, user: JSON.parse(userRaw) };
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

// ── Plan (stored in MongoDB via API) ─────────────────────────────────

export async function loadPlan(token: string): Promise<TrainingPlan | null> {
  try {
    const res = await fetch(`${API_URL}/api/plan`, { headers: authHeaders(token) });
    const { plan } = await res.json();
    return plan ?? null;
  } catch {
    return null;
  }
}

export async function clearPlan(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/plan`, { method: 'DELETE', headers: authHeaders(token) });
  } catch { /* ignore */ }
}

// ── Progress (stored in MongoDB via API) ──────────────────────────────

export async function loadProgress(token: string): Promise<PlanProgress | null> {
  try {
    const res = await fetch(`${API_URL}/api/progress`, { headers: authHeaders(token) });
    const { progress } = await res.json();
    return progress ? { planGeneratedAt: '', completedDays: progress.completedDays ?? [] } : null;
  } catch {
    return null;
  }
}

export async function markDayComplete(token: string, weekNumber: number, dayOfWeek: string): Promise<void> {
  const dayKey = `w${weekNumber}-${dayOfWeek}`;
  await fetch(`${API_URL}/api/progress/complete`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ dayKey }),
  });
}
