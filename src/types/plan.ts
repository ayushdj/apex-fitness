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

export interface MealOption {
  name: string;
  timing: string;
  calories: number;
  proteinG: number;
  options: string[];
}

export interface MealPlan {
  dailyCalories: number;
  dietaryPattern: string;
  macros: { proteinG: number; carbsG: number; fatG: number };
  meals: MealOption[];
  guidelines: string[];
  avoidList: string[];
}

export interface TrainingPlan {
  planName: string;
  goal: string;
  totalWeeks: number;
  weeksPerPhase: number;
  generatedAt: string;
  programSummary: string;
  weeks: TrainingWeek[];
  mealPlan?: MealPlan;
}

export interface WorkoutData {
  caloriesBurned: number;
  duration: number;       // minutes
  heartRate: number | null; // average BPM, null if unavailable
  workoutType: string;
  startDate: string;
}

export interface PlanProgress {
  planGeneratedAt?: string;
  completedDays: string[];
  workoutData?: Record<string, WorkoutData>;
}

export interface UserProfile {
  athleteIdentity?: string;
  goals?: string;
  schedule?: string;
  injuries?: string;
  nutrition?: string;
  diet?: string;
  planContext?: string;
  modifications?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}
