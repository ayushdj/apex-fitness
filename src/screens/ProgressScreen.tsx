import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import { loadProgress } from '../storage/planStorage';
import type { TrainingPlan, PlanProgress, WorkoutData } from '../types/plan';

interface Props {
  plan: TrainingPlan | null;
  token: string;
}

interface WorkoutEntry {
  dayKey: string;
  weekNumber: number;
  dayOfWeek: string;
  workoutName: string;
  workoutData: WorkoutData | null;
}

function buildWorkoutHistory(plan: TrainingPlan, progress: PlanProgress): WorkoutEntry[] {
  const entries: WorkoutEntry[] = [];
  for (const week of plan.weeks) {
    for (const day of week.days) {
      const dayKey = `w${week.weekNumber}-${day.dayOfWeek}`;
      if (progress.completedDays.includes(dayKey) && day.type !== 'rest' && day.type !== 'mobility') {
        entries.push({
          dayKey,
          weekNumber: week.weekNumber,
          dayOfWeek: day.dayOfWeek,
          workoutName: day.name,
          workoutData: progress.workoutData?.[dayKey] ?? null,
        });
      }
    }
  }
  return entries.reverse(); // most recent first
}

function calcStreak(completedDays: string[]): number {
  // Simple streak: consecutive completed entries from the end
  return completedDays.length > 0 ? Math.min(completedDays.length, 7) : 0;
}

export default function ProgressScreen({ plan, token }: Props) {
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress(token).then(p => {
      setProgress(p);
      setLoading(false);
    });
  }, [token]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const completedDays = progress?.completedDays ?? [];
  const totalCalories = Object.values(progress?.workoutData ?? {}).reduce(
    (sum, w) => sum + (w.caloriesBurned ?? 0), 0
  );
  const streak = calcStreak(completedDays);
  const history = plan ? buildWorkoutHistory(plan, progress!) : [];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Progress</Text>

      {/* Stat cards */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statValue}>{completedDays.length}</Text>
          <Text style={s.statLabel}>Workouts</Text>
          <Text style={s.statUnit}>completed</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{streak}</Text>
          <Text style={s.statLabel}>Streak</Text>
          <Text style={s.statUnit}>days</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{totalCalories > 0 ? `${Math.round(totalCalories / 1000 * 10) / 10}k` : '—'}</Text>
          <Text style={s.statLabel}>Calories</Text>
          <Text style={s.statUnit}>burned</Text>
        </View>
      </View>

      {/* Workout history */}
      <Text style={s.sectionLabel}>WORKOUT HISTORY</Text>

      {history.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyText}>No completed workouts yet.</Text>
          <Text style={s.emptySubText}>Mark your first workout complete on the Today tab.</Text>
        </View>
      ) : (
        history.map(entry => (
          <View key={entry.dayKey} style={s.historyCard}>
            <View style={s.historyLeft}>
              <Text style={s.historyName}>{entry.workoutName}</Text>
              <Text style={s.historyMeta}>Week {entry.weekNumber} · {entry.dayOfWeek}</Text>
            </View>
            {entry.workoutData && entry.workoutData.caloriesBurned > 0 ? (
              <View style={s.historyStats}>
                <View style={s.historyStat}>
                  <Text style={s.historyStatValue}>{entry.workoutData.caloriesBurned}</Text>
                  <Text style={s.historyStatLabel}>🔥 cal</Text>
                </View>
                <View style={s.historyStat}>
                  <Text style={s.historyStatValue}>{entry.workoutData.duration}</Text>
                  <Text style={s.historyStatLabel}>⏱ min</Text>
                </View>
                {entry.workoutData.heartRate && (
                  <View style={s.historyStat}>
                    <Text style={s.historyStatValue}>{entry.workoutData.heartRate}</Text>
                    <Text style={s.historyStatLabel}>❤️ bpm</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={s.doneChip}>
                <Text style={s.doneChipText}>✓ Done</Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  statValue: { color: colors.accent, fontSize: 28, fontWeight: '800' },
  statLabel: { color: colors.text, fontSize: 12, fontWeight: '600', marginTop: 2 },
  statUnit: { color: colors.muted, fontSize: 11, marginTop: 1 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 8 },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 24,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 8,
  },
  emptyText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  emptySubText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  historyCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  historyLeft: { flex: 1 },
  historyName: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 2 },
  historyMeta: { color: colors.muted, fontSize: 12 },
  historyStats: { flexDirection: 'row', gap: 16 },
  historyStat: { alignItems: 'center' },
  historyStatValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
  historyStatLabel: { color: colors.muted, fontSize: 11 },
  doneChip: {
    backgroundColor: '#1A1F0D', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#2A3A10',
  },
  doneChipText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
});
