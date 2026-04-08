import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { colors } from '../theme';
import type { TrainingPlan, MealOption } from '../types/plan';

const SCREEN_W = Dimensions.get('window').width;
const PROTEIN_COLOR = '#4ade80';
const CARBS_COLOR   = '#60a5fa';
const FAT_COLOR     = '#fbbf24';

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙',
  snack: '🍎', 'pre-workout': '⚡', 'post-workout': '💪',
};

function mealIcon(name: string) {
  const key = name.toLowerCase().replace(/[^a-z-]/g, '');
  for (const k of Object.keys(MEAL_ICONS)) {
    if (key.includes(k)) return MEAL_ICONS[k];
  }
  return '🍽️';
}

interface Props { plan: TrainingPlan | null; }

export default function NutritionScreen({ plan }: Props) {
  if (!plan) {
    return <View style={s.center}><ActivityIndicator color={colors.accent} size="large" /></View>;
  }

  const mp = plan.mealPlan;

  if (!mp) {
    return (
      <View style={s.center}>
        <Text style={s.emptyIcon}>🥗</Text>
        <Text style={s.emptyTitle}>No Nutrition Plan Yet</Text>
        <Text style={s.emptyText}>
          Tap ✏️ Modify in the Plan tab and tell APEX your diet — your new plan will include a full personalised meal plan.
        </Text>
      </View>
    );
  }

  const proteinCal = mp.macros.proteinG * 4;
  const carbsCal   = mp.macros.carbsG   * 4;
  const fatCal     = mp.macros.fatG     * 9;
  const totalCal   = proteinCal + carbsCal + fatCal || mp.dailyCalories;
  const proteinPct = Math.round((proteinCal / totalCal) * 100);
  const carbsPct   = Math.round((carbsCal   / totalCal) * 100);
  const fatPct     = 100 - proteinPct - carbsPct;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <View style={s.heroCard}>
        <View style={s.heroBadge}>
          <Text style={s.heroBadgeText}>{(mp.dietaryPattern ?? 'Custom').toUpperCase()}</Text>
        </View>
        <Text style={s.heroCalories}>{mp.dailyCalories.toLocaleString()}</Text>
        <Text style={s.heroCalLabel}>calories / day</Text>

        {/* Macro rings */}
        <View style={s.ringsRow}>
          <MacroRing label="Protein" grams={mp.macros.proteinG} pct={proteinPct} color={PROTEIN_COLOR} />
          <MacroRing label="Carbs"   grams={mp.macros.carbsG}   pct={carbsPct}   color={CARBS_COLOR}   />
          <MacroRing label="Fat"     grams={mp.macros.fatG}      pct={fatPct}     color={FAT_COLOR}     />
        </View>

        {/* Calorie split bar */}
        <View style={s.splitBar}>
          <View style={[s.splitFill, { flex: proteinPct, backgroundColor: PROTEIN_COLOR }]} />
          <View style={[s.splitFill, { flex: carbsPct,   backgroundColor: CARBS_COLOR   }]} />
          <View style={[s.splitFill, { flex: fatPct,     backgroundColor: FAT_COLOR     }]} />
        </View>
        <View style={s.splitLegend}>
          <LegendDot color={PROTEIN_COLOR} label={`${proteinPct}% protein`} />
          <LegendDot color={CARBS_COLOR}   label={`${carbsPct}% carbs`}   />
          <LegendDot color={FAT_COLOR}     label={`${fatPct}% fat`}       />
        </View>
      </View>

      {/* ── Calorie budget mini-bars ───────────────────────────── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>CALORIE BREAKDOWN</Text>
      </View>
      <View style={s.budgetCard}>
        <BudgetRow label="Protein" kcal={proteinCal} total={mp.dailyCalories} color={PROTEIN_COLOR} grams={mp.macros.proteinG} unit="g" />
        <BudgetRow label="Carbs"   kcal={carbsCal}   total={mp.dailyCalories} color={CARBS_COLOR}   grams={mp.macros.carbsG}   unit="g" />
        <BudgetRow label="Fat"     kcal={fatCal}     total={mp.dailyCalories} color={FAT_COLOR}     grams={mp.macros.fatG}     unit="g" />
      </View>

      {/* ── Meal timeline ─────────────────────────────────────── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>DAILY MEAL PLAN</Text>
        <Text style={s.sectionHint}>tap to expand</Text>
      </View>
      <View style={s.timeline}>
        {mp.meals.map((meal, i) => (
          <MealRow key={i} meal={meal} isLast={i === mp.meals.length - 1} totalCal={mp.dailyCalories} />
        ))}
      </View>

      {/* ── Guidelines ────────────────────────────────────────── */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>COACH GUIDELINES</Text>
      </View>
      <View style={s.guidelinesCard}>
        {mp.guidelines.map((g, i) => (
          <View key={i} style={[s.guidelineRow, i > 0 && s.guidelineBorder]}>
            <View style={s.guidelineNumBadge}>
              <Text style={s.guidelineNumText}>{i + 1}</Text>
            </View>
            <Text style={s.guidelineText}>{g}</Text>
          </View>
        ))}
      </View>

      {/* ── Avoid list ────────────────────────────────────────── */}
      {mp.avoidList?.length > 0 && (
        <>
          <View style={s.sectionHeader}>
            <Text style={s.sectionLabel}>MINIMIZE / AVOID</Text>
          </View>
          <View style={s.avoidWrap}>
            {mp.avoidList.map((item, i) => (
              <View key={i} style={s.avoidChip}>
                <Text style={s.avoidChipText}>✕  {item}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

// ── Macro ring ─────────────────────────────────────────────────────────
function MacroRing({ label, grams, pct, color }: {
  label: string; grams: number; pct: number; color: string;
}) {
  return (
    <View style={r.wrap}>
      <View style={[r.ring, { borderColor: color }]}>
        <Text style={[r.pct, { color }]}>{pct}<Text style={r.pctSign}>%</Text></Text>
      </View>
      <Text style={r.grams}>{grams}g</Text>
      <Text style={r.label}>{label}</Text>
    </View>
  );
}

const r = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  ring: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 5, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pct: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  pctSign: { fontSize: 12 },
  grams: { color: colors.text, fontSize: 15, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 11, fontWeight: '600' },
});

// ── Legend dot ─────────────────────────────────────────────────────────
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={l.row}>
      <View style={[l.dot, { backgroundColor: color }]} />
      <Text style={l.label}>{label}</Text>
    </View>
  );
}

const l = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { color: colors.muted, fontSize: 11 },
});

// ── Budget row ─────────────────────────────────────────────────────────
function BudgetRow({ label, kcal, total, color, grams, unit }: {
  label: string; kcal: number; total: number; color: string; grams: number; unit: string;
}) {
  const pct = Math.min(100, Math.round((kcal / total) * 100));
  const barW = (SCREEN_W - 32 - 32 - 80) * (pct / 100);
  return (
    <View style={b.row}>
      <Text style={b.label}>{label}</Text>
      <View style={b.barBg}>
        <View style={[b.barFill, { width: barW, backgroundColor: color }]} />
      </View>
      <Text style={b.kcal}>{kcal} kcal</Text>
    </View>
  );
}

const b = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600', width: 56 },
  barBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  kcal: { color: colors.muted, fontSize: 12, width: 68, textAlign: 'right' },
});

// ── Meal row (timeline) ────────────────────────────────────────────────
function MealRow({ meal, isLast, totalCal }: { meal: MealOption; isLast: boolean; totalCal: number }) {
  const [open, setOpen] = useState(false);
  const calPct = Math.min(100, Math.round((meal.calories / totalCal) * 100));
  const icon = mealIcon(meal.name);

  return (
    <View style={m.wrapper}>
      {/* Timeline spine */}
      <View style={m.spine}>
        <View style={m.dot} />
        {!isLast && <View style={m.line} />}
      </View>

      {/* Card */}
      <View style={m.card}>
        <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
          <View style={m.cardHeader}>
            <Text style={m.icon}>{icon}</Text>
            <View style={m.cardInfo}>
              <Text style={m.mealName}>{meal.name}</Text>
              <Text style={m.mealTiming}>{meal.timing}</Text>
            </View>
            <View style={m.calBadge}>
              <Text style={m.calText}>{meal.calories}</Text>
              <Text style={m.calUnit}>kcal</Text>
            </View>
            <Text style={m.chevron}>{open ? '▲' : '▼'}</Text>
          </View>

          {/* Calorie fill bar */}
          <View style={m.calBar}>
            <View style={[m.calBarFill, { width: `${calPct}%` as any }]} />
          </View>
          <Text style={m.proteinHint}>{meal.proteinG}g protein · {calPct}% of daily calories</Text>
        </TouchableOpacity>

        {/* Options */}
        {open && (
          <View style={m.options}>
            {meal.options.map((opt, j) => (
              <View key={j} style={[m.optRow, j > 0 && m.optBorder]}>
                <View style={[m.optBadge, j === 0 ? m.optBadgeA : m.optBadgeB]}>
                  <Text style={m.optBadgeText}>{j === 0 ? 'A' : 'B'}</Text>
                </View>
                <Text style={m.optText}>{opt}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const m = StyleSheet.create({
  wrapper: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  spine: { alignItems: 'center', width: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent, marginTop: 16 },
  line: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 4 },
  card: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden', marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  icon: { fontSize: 22 },
  cardInfo: { flex: 1 },
  mealName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  mealTiming: { color: colors.muted, fontSize: 12, marginTop: 1 },
  calBadge: { alignItems: 'flex-end' },
  calText: { color: colors.accent, fontSize: 18, fontWeight: '800', lineHeight: 20 },
  calUnit: { color: colors.muted, fontSize: 10 },
  chevron: { color: colors.muted, fontSize: 10, marginLeft: 4 },
  calBar: {
    height: 3, backgroundColor: colors.border,
    marginHorizontal: 14, borderRadius: 2, overflow: 'hidden', marginBottom: 4,
  },
  calBarFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  proteinHint: { color: colors.muted, fontSize: 11, paddingHorizontal: 14, paddingBottom: 10 },
  options: { borderTopWidth: 1, borderTopColor: colors.border },
  optRow: { flexDirection: 'row', gap: 10, padding: 12, alignItems: 'flex-start' },
  optBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  optBadge: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  optBadgeA: { backgroundColor: colors.accent },
  optBadgeB: { backgroundColor: colors.border },
  optBadgeText: { color: colors.bg, fontSize: 11, fontWeight: '800' },
  optText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'center' },

  // Hero
  heroCard: {
    backgroundColor: colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, padding: 24,
    alignItems: 'center', gap: 12,
  },
  heroBadge: {
    backgroundColor: `${colors.accent}22`, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  heroBadgeText: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  heroCalories: { color: colors.text, fontSize: 56, fontWeight: '900', lineHeight: 60 },
  heroCalLabel: { color: colors.muted, fontSize: 13, marginTop: -4 },
  ringsRow: { flexDirection: 'row', gap: 28, marginTop: 8 },
  splitBar: {
    flexDirection: 'row', height: 8, borderRadius: 4,
    overflow: 'hidden', width: '100%', gap: 2,
  },
  splitFill: { height: '100%' },
  splitLegend: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },

  // Budget
  budgetCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 16, paddingVertical: 4,
  },

  // Section headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionLabel: { color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  sectionHint: { color: colors.muted, fontSize: 11 },

  // Timeline container
  timeline: {},

  // Guidelines
  guidelinesCard: {
    backgroundColor: '#1A1F0D', borderRadius: 16,
    borderWidth: 1, borderColor: '#2A3A10', overflow: 'hidden',
  },
  guidelineRow: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  guidelineBorder: { borderTopWidth: 1, borderTopColor: '#2A3A10' },
  guidelineNumBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  guidelineNumText: { color: colors.bg, fontSize: 13, fontWeight: '800' },
  guidelineText: { color: colors.text, fontSize: 14, lineHeight: 20, flex: 1 },

  // Avoid chips
  avoidWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  avoidChip: {
    backgroundColor: '#2a0d0d', borderWidth: 1, borderColor: '#5a1a1a',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  avoidChipText: { color: '#f87171', fontSize: 13, fontWeight: '600' },
});
