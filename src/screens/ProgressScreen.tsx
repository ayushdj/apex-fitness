import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme';

const stats = [
  { label: 'Workouts', value: '12', unit: 'this month' },
  { label: 'Streak', value: '6', unit: 'days' },
  { label: 'Volume', value: '48.2k', unit: 'lbs lifted' },
];

const lifts = [
  { name: 'Back Squat', current: '225', prev: '205', unit: 'lbs' },
  { name: 'Deadlift', current: '295', prev: '275', unit: 'lbs' },
  { name: 'Bench Press', current: '175', prev: '165', unit: 'lbs' },
  { name: '5K Run', current: '24:10', prev: '25:40', unit: 'min', down: true },
];

export default function ProgressScreen() {
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Progress</Text>

      {/* Stat cards */}
      <View style={s.statsRow}>
        {stats.map(stat => (
          <View key={stat.label} style={s.statCard}>
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{stat.label}</Text>
            <Text style={s.statUnit}>{stat.unit}</Text>
          </View>
        ))}
      </View>

      {/* PRs */}
      <Text style={s.sectionLabel}>PERSONAL RECORDS</Text>
      {lifts.map(lift => {
        const improved = lift.down
          ? lift.current < lift.prev
          : parseFloat(lift.current) > parseFloat(lift.prev);
        return (
          <View key={lift.name} style={s.liftCard}>
            <View style={s.liftInfo}>
              <Text style={s.liftName}>{lift.name}</Text>
              <Text style={s.liftPrev}>Prev: {lift.prev} {lift.unit}</Text>
            </View>
            <View style={s.liftRight}>
              <Text style={s.liftCurrent}>{lift.current}</Text>
              <Text style={s.liftUnit}>{lift.unit}</Text>
              <Text style={s.liftBadge}>▲ PR</Text>
            </View>
          </View>
        );
      })}

      {/* Body weight chart placeholder */}
      <Text style={s.sectionLabel}>BODY WEIGHT</Text>
      <View style={s.chartCard}>
        <View style={s.chartBars}>
          {[168, 169, 167, 168, 166, 167, 165].map((w, i) => {
            const h = ((w - 160) / 15) * 80;
            return (
              <View key={i} style={s.barCol}>
                <View style={[s.bar, { height: h }]} />
                <Text style={s.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
              </View>
            );
          })}
        </View>
        <Text style={s.chartSub}>7-day average: 167.1 lbs · Trend: ↓ 0.8 lbs/week</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
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
  liftCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  liftInfo: { flex: 1 },
  liftName: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 2 },
  liftPrev: { color: colors.muted, fontSize: 12 },
  liftRight: { alignItems: 'flex-end' },
  liftCurrent: { color: colors.text, fontSize: 22, fontWeight: '800' },
  liftUnit: { color: colors.muted, fontSize: 12 },
  liftBadge: { color: colors.accent, fontSize: 11, fontWeight: '700', marginTop: 2 },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100, marginBottom: 12 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  bar: { width: '100%', backgroundColor: colors.accent, borderRadius: 4, minHeight: 4 },
  barLabel: { color: colors.muted, fontSize: 10 },
  chartSub: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
