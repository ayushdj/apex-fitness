import type { TrainingPlan, TrainingDay } from '../types/plan';

const DAY_MAP: Record<number, TrainingDay['dayOfWeek']> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

export function getCurrentWeekNumber(planGeneratedAt: string): number {
  const startDate = new Date(planGeneratedAt);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.floor(daysSinceStart / 7) + 1, 8);
}

export function getTodayWorkout(
  plan: TrainingPlan,
  planGeneratedAt: string
): { week: number; day: TrainingDay } | null {
  const weekNumber = getCurrentWeekNumber(planGeneratedAt);
  const todayDow = DAY_MAP[new Date().getDay()];

  let week = plan.weeks.find(w => w.weekNumber === weekNumber);
  // For weeks beyond what's detailed, fall back to week 2's structure
  if (!week) week = plan.weeks.find(w => w.weekNumber === 2) ?? plan.weeks[plan.weeks.length - 1];
  if (!week) return null;

  const day = week.days.find(d => d.dayOfWeek === todayDow);
  return day ? { week: weekNumber, day } : null;
}

export function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
}
