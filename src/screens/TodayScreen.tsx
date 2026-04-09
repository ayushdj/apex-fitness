import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import { getTodayWorkout, getTodayLabel } from '../utils/planUtils';
import { loadProgress, markDayComplete } from '../storage/planStorage';
import { getMostRecentWorkout } from '../services/healthService';
import type { TrainingPlan, PlanProgress, Exercise, WorkoutData } from '../types/plan';

interface Props {
  plan: TrainingPlan | null;
  token: string;
}

export default function TodayScreen({ plan, token }: Props) {
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [checkedExercises, setCheckedExercises] = useState<Set<number>>(new Set());
  const [workoutDone, setWorkoutDone] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completedWorkoutData, setCompletedWorkoutData] = useState<WorkoutData | null>(null);

  useEffect(() => {
    loadProgress(token).then(setProgress);
  }, [token]);

  if (!plan || !progress) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const todayData = getTodayWorkout(plan, progress.planGeneratedAt ?? plan.generatedAt);

  if (!todayData) {
    return (
      <View style={s.center}>
        <Text style={s.emptyText}>No workout data for today.</Text>
      </View>
    );
  }

  const { week, day } = todayData;
  const dayKey = `w${week}-${day.dayOfWeek}`;
  const alreadyComplete = progress.completedDays.includes(dayKey) || workoutDone;
  const savedWorkoutData = progress.workoutData?.[dayKey] ?? completedWorkoutData;
  const isRestDay = day.type === 'rest' || day.type === 'mobility';

  const toggleExercise = (index: number) => {
    setCheckedExercises(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const completeWorkout = async () => {
    setCompleting(true);
    try {
      // Silently pull Apple Watch data — no error shown if unavailable
      const healthData = await getMostRecentWorkout();
      await markDayComplete(token, week, day.dayOfWeek, healthData ?? undefined);
      if (healthData) setCompletedWorkoutData(healthData);
      setWorkoutDone(true);
    } finally {
      setCompleting(false);
    }
  };

  const pct = day.exercises.length > 0
    ? Math.round((checkedExercises.size / day.exercises.length) * 100)
    : 100;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Day header */}
      <View style={s.dayCard}>
        <Text style={s.dayLabel}>{getTodayLabel()} · WEEK {week}</Text>
        <Text style={s.dayTitle}>{day.name}</Text>
        <Text style={s.daySub}>
          {isRestDay
            ? 'Rest & Recovery'
            : `${day.exercises.length} exercises${day.durationMinutes ? ` · ~${day.durationMinutes} min` : ''} · ${day.focus}`}
        </Text>

        {!isRestDay && (
          <>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={s.progressText}>{checkedExercises.size}/{day.exercises.length} complete</Text>
          </>
        )}
      </View>

      {/* Exercises */}
      {!isRestDay && day.exercises.length > 0 && (
        <>
          <Text style={s.sectionLabel}>EXERCISES</Text>
          {day.exercises.map((ex: Exercise, i: number) => {
            const done = checkedExercises.has(i);
            return (
              <TouchableOpacity key={i} style={[s.exerciseCard, done && s.exerciseDone]} onPress={() => toggleExercise(i)}>
                <View style={[s.checkbox, done && s.checkboxDone]}>
                  {done && <Text style={s.checkmark}>✓</Text>}
                </View>
                <View style={s.exerciseInfo}>
                  <Text style={[s.exerciseName, done && s.textDone]}>{ex.name}</Text>
                  <Text style={s.exerciseMeta}>
                    {ex.sets} × {ex.reps}{ex.weight && ex.weight !== 'BW' ? ` · ${ex.weight}` : ex.weight === 'BW' ? ' · Bodyweight' : ''}
                  </Text>
                  {ex.notes ? <Text style={s.exerciseNotes}>{ex.notes}</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {/* Coach tip */}
      {day.coachTip ? (
        <View style={s.tipCard}>
          <Text style={s.tipLabel}>COACH TIP</Text>
          <Text style={s.tipText}>{day.coachTip}</Text>
        </View>
      ) : null}

      {/* Complete button */}
      {!isRestDay && !alreadyComplete && (
        <TouchableOpacity style={[s.completeBtn, completing && s.btnDisabled]} onPress={completeWorkout} disabled={completing}>
          {completing
            ? <ActivityIndicator color={colors.bg} />
            : <Text style={s.completeBtnText}>Mark Workout Complete</Text>
          }
        </TouchableOpacity>
      )}

      {/* Done card — with Apple Watch data if available */}
      {alreadyComplete && (
        <View style={s.doneCard}>
          <Text style={s.doneText}>✓ Workout complete!</Text>
          {savedWorkoutData && savedWorkoutData.caloriesBurned > 0 && (
            <View style={s.watchStats}>
              <WorkoutStat icon="🔥" value={`${savedWorkoutData.caloriesBurned}`} label="cal burned" />
              <WorkoutStat icon="⏱" value={`${savedWorkoutData.duration}`} label="minutes" />
              {savedWorkoutData.heartRate && (
                <WorkoutStat icon="❤️" value={`${savedWorkoutData.heartRate}`} label="avg bpm" />
              )}
            </View>
          )}
          {savedWorkoutData && (
            <Text style={s.watchSource}>
              {savedWorkoutData.workoutType} · synced from Apple Watch
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function WorkoutStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={s.statItem}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.muted, fontSize: 15 },
  dayCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  dayLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  dayTitle: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  daySub: { color: colors.muted, fontSize: 13, marginBottom: 16 },
  progressBg: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  progressText: { color: colors.muted, fontSize: 12 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  exerciseCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  exerciseDone: { opacity: 0.5 },
  checkbox: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0,
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.bg, fontSize: 13, fontWeight: '800' },
  exerciseInfo: { flex: 1 },
  exerciseName: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 2 },
  textDone: { textDecorationLine: 'line-through' },
  exerciseMeta: { color: colors.muted, fontSize: 13, marginBottom: 2 },
  exerciseNotes: { color: colors.muted, fontSize: 12, fontStyle: 'italic' },
  tipCard: {
    backgroundColor: '#1A1F0D', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#2A3A10', marginTop: 4,
  },
  tipLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  tipText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  completeBtn: {
    backgroundColor: colors.accent, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  completeBtnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  doneCard: {
    backgroundColor: '#1A1F0D', borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#2A3A10', marginTop: 8, gap: 12,
  },
  doneText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  watchStats: { flexDirection: 'row', gap: 24, marginTop: 4 },
  statItem: { alignItems: 'center', gap: 2 },
  statIcon: { fontSize: 20 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  watchSource: { color: colors.muted, fontSize: 11, marginTop: 4 },
});
