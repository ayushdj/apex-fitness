import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import { getTodayWorkout, getTodayLabel } from '../utils/planUtils';
import { loadProgress, markDayComplete } from '../storage/planStorage';
import type { TrainingPlan, PlanProgress, Exercise } from '../types/plan';

interface Props {
  plan: TrainingPlan | null;
  token: string;
}

export default function TodayScreen({ plan, token }: Props) {
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [checkedExercises, setCheckedExercises] = useState<Set<number>>(new Set());
  const [workoutDone, setWorkoutDone] = useState(false);

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
  const isRestDay = day.type === 'rest' || day.type === 'mobility';

  const toggleExercise = (index: number) => {
    setCheckedExercises(prev => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  const completeWorkout = async () => {
    await markDayComplete(token, week, day.dayOfWeek);
    setWorkoutDone(true);
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
        <TouchableOpacity style={s.completeBtn} onPress={completeWorkout}>
          <Text style={s.completeBtnText}>Mark Workout Complete</Text>
        </TouchableOpacity>
      )}

      {alreadyComplete && (
        <View style={s.doneCard}>
          <Text style={s.doneText}>✓ Workout complete!</Text>
        </View>
      )}
    </ScrollView>
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
  completeBtnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  doneCard: {
    backgroundColor: '#1A1F0D', borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#2A3A10', marginTop: 8,
  },
  doneText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
});
