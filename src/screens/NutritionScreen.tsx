import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme';
import type { TrainingPlan } from '../types/plan';

interface Props {
  plan: TrainingPlan | null;
}

export default function NutritionScreen({ plan }: Props) {
  if (!plan) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const mp = plan.mealPlan;

  if (!mp) {
    return (
      <View style={s.center}>
        <Text style={s.emptyIcon}>🥗</Text>
        <Text style={s.emptyTitle}>No Nutrition Plan Yet</Text>
        <Text style={s.emptyText}>
          Use the ✏️ Modify button in your Plan tab to regenerate your plan — your new plan will include a personalized meal plan.
        </Text>
      </View>
    );
  }

  const proteinPct = Math.round((mp.macros.proteinG * 4 / mp.dailyCalories) * 100);
  const carbsPct   = Math.round((mp.macros.carbsG * 4  / mp.dailyCalories) * 100);
  const fatPct     = Math.round((mp.macros.fatG * 9    / mp.dailyCalories) * 100);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Nutrition Plan</Text>
      <Text style={s.subtitle}>{mp.dietaryPattern?.charAt(0).toUpperCase() + mp.dietaryPattern?.slice(1)} · {mp.dailyCalories} kcal/day</Text>

      {/* Macro bar */}
      <View style={s.macroCard}>
        <Text style={s.sectionLabel}>DAILY MACROS</Text>
        <View style={s.macroRow}>
          <MacroBlock label="Protein" value={mp.macros.proteinG} unit="g" pct={proteinPct} color="#4ade80" />
          <MacroBlock label="Carbs"   value={mp.macros.carbsG}   unit="g" pct={carbsPct}   color="#60a5fa" />
          <MacroBlock label="Fat"     value={mp.macros.fatG}      unit="g" pct={fatPct}     color="#fbbf24" />
        </View>
        <View style={s.macroBar}>
          <View style={[s.macroBarFill, { flex: proteinPct, backgroundColor: '#4ade80' }]} />
          <View style={[s.macroBarFill, { flex: carbsPct,   backgroundColor: '#60a5fa' }]} />
          <View style={[s.macroBarFill, { flex: fatPct,     backgroundColor: '#fbbf24' }]} />
        </View>
      </View>

      {/* Meals */}
      <Text style={s.sectionLabel}>DAILY MEALS</Text>
      {mp.meals.map((meal, i) => (
        <View key={i} style={s.mealCard}>
          <View style={s.mealHeader}>
            <View>
              <Text style={s.mealName}>{meal.name}</Text>
              <Text style={s.mealTiming}>{meal.timing}</Text>
            </View>
            <View style={s.mealMacros}>
              <Text style={s.mealCal}>{meal.calories} kcal</Text>
              <Text style={s.mealProt}>{meal.proteinG}g protein</Text>
            </View>
          </View>
          {meal.options.map((opt, j) => (
            <View key={j} style={s.optionRow}>
              <Text style={s.optionBullet}>{j === 0 ? 'Option A' : 'Option B'}</Text>
              <Text style={s.optionText}>{opt}</Text>
            </View>
          ))}
        </View>
      ))}

      {/* Guidelines */}
      <Text style={s.sectionLabel}>COACH GUIDELINES</Text>
      <View style={s.guidelinesCard}>
        {mp.guidelines.map((g, i) => (
          <View key={i} style={[s.guidelineRow, i > 0 && s.guidelineBorder]}>
            <Text style={s.guidelineNum}>{i + 1}</Text>
            <Text style={s.guidelineText}>{g}</Text>
          </View>
        ))}
      </View>

      {/* Avoid list */}
      {mp.avoidList?.length > 0 && (
        <>
          <Text style={s.sectionLabel}>MINIMIZE / AVOID</Text>
          <View style={s.avoidCard}>
            {mp.avoidList.map((item, i) => (
              <View key={i} style={s.avoidRow}>
                <Text style={s.avoidX}>✕</Text>
                <Text style={s.avoidText}>{item}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function MacroBlock({
  label, value, unit, pct, color,
}: {
  label: string; value: number; unit: string; pct: number; color: string;
}) {
  return (
    <View style={s.macroBlock}>
      <Text style={[s.macroValue, { color }]}>{value}<Text style={s.macroUnit}>{unit}</Text></Text>
      <Text style={s.macroLabel}>{label}</Text>
      <Text style={s.macroPct}>{pct}%</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  subtitle: { color: colors.muted, fontSize: 13, marginBottom: 8 },
  sectionLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4 },

  // Macro card
  macroCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12,
  },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around' },
  macroBlock: { alignItems: 'center', gap: 2 },
  macroValue: { fontSize: 26, fontWeight: '800' },
  macroUnit: { fontSize: 14, fontWeight: '600' },
  macroLabel: { color: colors.muted, fontSize: 12 },
  macroPct: { color: colors.muted, fontSize: 11 },
  macroBar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1 },
  macroBarFill: { height: '100%' },

  // Meal cards
  mealCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 14, paddingBottom: 10,
  },
  mealName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  mealTiming: { color: colors.muted, fontSize: 12, marginTop: 2 },
  mealMacros: { alignItems: 'flex-end' },
  mealCal: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  mealProt: { color: colors.muted, fontSize: 12 },
  optionRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-start',
  },
  optionBullet: { color: colors.accent, fontSize: 11, fontWeight: '700', minWidth: 52, paddingTop: 2 },
  optionText: { color: colors.text, fontSize: 13, lineHeight: 19, flex: 1 },

  // Guidelines
  guidelinesCard: {
    backgroundColor: '#1A1F0D', borderRadius: 16,
    borderWidth: 1, borderColor: '#2A3A10', overflow: 'hidden',
  },
  guidelineRow: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  guidelineBorder: { borderTopWidth: 1, borderTopColor: '#2A3A10' },
  guidelineNum: {
    color: colors.accent, fontSize: 16, fontWeight: '800',
    width: 24, textAlign: 'center',
  },
  guidelineText: { color: colors.text, fontSize: 14, lineHeight: 20, flex: 1 },

  // Avoid list
  avoidCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  avoidRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center',
  },
  avoidX: { color: '#ef4444', fontSize: 12, fontWeight: '800', width: 16 },
  avoidText: { color: colors.muted, fontSize: 13, flex: 1 },
});
