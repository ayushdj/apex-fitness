import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrainingPlan, PlanProgress, WorkoutData } from '../types/plan';
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

export async function loadPlan(token: string): Promise<TrainingPlan | 'unauthorized' | null> {
  try {
    const res = await fetch(`${API_URL}/api/plan`, { headers: authHeaders(token) });
    if (res.status === 401) return 'unauthorized';
    const { plan } = await res.json();
    return plan ?? null;
  } catch (e) {
    console.error('[loadPlan] fetch failed:', e);
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
    return progress ? {
      planGeneratedAt: '',
      completedDays: progress.completedDays ?? [],
      workoutData: progress.workoutData ?? {},
    } : null;
  } catch {
    return null;
  }
}

export async function loadCredits(token: string): Promise<{ credits: number; creditsUsed: number } | null> {
  try {
    const res = await fetch(`${API_URL}/api/credits`, { headers: authHeaders(token) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function markDayComplete(
  token: string,
  weekNumber: number,
  dayOfWeek: string,
  workoutData?: WorkoutData,
): Promise<void> {
  const dayKey = `w${weekNumber}-${dayOfWeek}`;
  await fetch(`${API_URL}/api/progress/complete`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ dayKey, workoutData }),
  });
}
