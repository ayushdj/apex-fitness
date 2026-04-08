import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import { loadProgress } from '../storage/planStorage';
import { getCurrentWeekNumber } from '../utils/planUtils';
import type { TrainingPlan, PlanProgress, TrainingDay } from '../types/plan';

interface Props {
  plan: TrainingPlan | null;
  token: string;
  onModify: () => void;
}

const TYPE_COLOR: Record<TrainingDay['type'], string> = {
  strength: colors.accent,
  conditioning: '#F4A35C',
  cardio: '#5CE4F4',
  mobility: '#A35CF4',
  rest: colors.border,
};

export default function PlanScreen({ plan, token, onModify }: Props) {
  const [progress, setProgress] = useState<PlanProgress | null>(null);
  const [expanded, setExpanded] = useState<number>(1);

  useEffect(() => {
    loadProgress(token).then(p => {
      setProgress(p);
      if (p) setExpanded(getCurrentWeekNumber(p.planGeneratedAt));
    });
  }, []);

  if (!plan) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const currentWeek = progress ? getCurrentWeekNumber(progress.planGeneratedAt) : 1;

  // Stub weeks 3–8 since we only generate 2 in detail
  const allWeekLabels = [
    { weekNumber: 1, label: plan.weeks[0]?.label ?? 'Foundation' },
    { weekNumber: 2, label: plan.weeks[1]?.label ?? 'Build' },
    { weekNumber: 3, label: 'Intensification' },
    { weekNumber: 4, label: 'Intensification' },
    { weekNumber: 5, label: 'Peak' },
    { weekNumber: 6, label: 'Peak' },
    { weekNumber: 7, label: 'Deload' },
    { weekNumber: 8, label: 'Test Week' },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.titleRow}>
        <View style={s.titleBlock}>
          <Text style={s.title}>{plan.planName}</Text>
          <Text style={s.goal}>{plan.goal}</Text>
        </View>
        <TouchableOpacity style={s.modifyBtn} onPress={onModify}>
          <Text style={s.modifyBtnText}>✏️ Modify</Text>
        </TouchableOpacity>
      </View>

      {/* Program summary */}
      <View style={s.summaryCard}>
        <Text style={s.summaryLabel}>8-WEEK OVERVIEW</Text>
        <Text style={s.summaryText}>{plan.programSummary}</Text>
      </View>

      {/* Week cards */}
      {allWeekLabels.map(({ weekNumber, label }) => {
        const weekData = plan.weeks.find(w => w.weekNumber === weekNumber);
        const isDetailed = !!weekData;
        const isOpen = expanded === weekNumber;
        const isCurrent = currentWeek === weekNumber;
        const doneDays = progress
          ? weekData?.days.filter(d => progress.completedDays.includes(`w${weekNumber}-${d.dayOfWeek}`)).length ?? 0
          : 0;
        const totalDays = weekData?.days.filter(d => d.type !== 'rest').length ?? 0;

        return (
          <View key={weekNumber} style={[s.weekCard, isCurrent && s.weekCardCurrent]}>
            <TouchableOpacity
              style={s.weekHeader}
              onPress={() => isDetailed && setExpanded(isOpen ? 0 : weekNumber)}
              disabled={!isDetailed}
            >
              <View style={s.weekHeaderLeft}>
                {isCurrent && <View style={s.currentDot} />}
                <View>
                  <Text style={s.weekLabel}>
                    WEEK {weekNumber} · {label.toUpperCase()}
                    {isCurrent ? '  ←  YOU ARE HERE' : ''}
                  </Text>
                  {isDetailed ? (
                    <Text style={s.weekProgress}>
                      {weekData?.theme ?? ''}
                      {totalDays > 0 ? `  ·  ${doneDays}/${totalDays} days done` : ''}
                    </Text>
                  ) : (
                    <Text style={s.weekProgress}>Unlocks as you progress</Text>
                  )}
                </View>
              </View>
              {isDetailed && <Text style={s.chevron}>{isOpen ? '▲' : '▼'}</Text>}
            </TouchableOpacity>

            {isOpen && isDetailed && weekData!.days.map((day, i) => {
              const isDone = progress?.completedDays.includes(`w${weekNumber}-${day.dayOfWeek}`);
              const dotColor = TYPE_COLOR[day.type] ?? colors.border;
              return (
                <View key={i} style={[s.dayRow, i > 0 && s.dayBorder]}>
                  <View style={[s.dayDot, { backgroundColor: isDone ? colors.accent : dotColor }]} />
                  <View style={s.dayInfo}>
                    <Text style={[s.dayName, isDone && s.dayNameDone]}>
                      {day.dayOfWeek}  ·  {day.name}
                    </Text>
                    <Text style={s.dayFocus}>{day.focus}</Text>
                  </View>
                  {isDone && <Text style={s.checkBadge}>✓</Text>}
                </View>
              );
            })}
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleBlock: { flex: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  goal: { color: colors.muted, fontSize: 13, marginBottom: 4 },
  modifyBtn: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, marginTop: 2,
  },
  modifyBtnText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  summaryCard: {
    backgroundColor: '#1A1F0D', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#2A3A10',
  },
  summaryLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  summaryText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  weekCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  weekCardCurrent: { borderColor: colors.accent },
  weekHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16,
  },
  weekHeaderLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1 },
  currentDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 5,
  },
  weekLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  weekProgress: { color: colors.muted, fontSize: 12 },
  chevron: { color: colors.muted, fontSize: 12 },
  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  dayBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  dayDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  dayInfo: { flex: 1 },
  dayName: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 1 },
  dayNameDone: { color: colors.muted },
  dayFocus: { color: colors.muted, fontSize: 12 },
  checkBadge: { color: colors.accent, fontSize: 14, fontWeight: '700' },
});
