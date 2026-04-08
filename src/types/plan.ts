export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  notes: string;
}

export interface TrainingDay {
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  name: string;
  type: 'strength' | 'cardio' | 'conditioning' | 'rest' | 'mobility';
  focus: string;
  durationMinutes: number;
  exercises: Exercise[];
  coachTip: string;
}

export interface TrainingWeek {
  weekNumber: number;
  label: string;
  theme: string;
  days: TrainingDay[];
}

export interface TrainingPlan {
  planName: string;
  goal: string;
  totalWeeks: number;
  weeksPerPhase: number;
  generatedAt: string;
  programSummary: string;
  weeks: TrainingWeek[];
}

export interface PlanProgress {
  planGeneratedAt?: string;
  completedDays: string[];
}

export interface UserProfile {
  athleteIdentity?: string;
  goals?: string;
  schedule?: string;
  injuries?: string;
  nutrition?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}
