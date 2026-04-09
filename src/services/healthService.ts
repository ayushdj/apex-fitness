import { Platform } from 'react-native';
import type { WorkoutData } from '../types/plan';

// react-native-health is iOS only — import lazily so Android doesn't crash
let AppleHealthKit: any = null;
if (Platform.OS === 'ios') {
  AppleHealthKit = require('react-native-health').default;
}

const PERMISSIONS = {
  permissions: {
    read: [
      'Workout',
      'ActiveEnergyBurned',
      'HeartRate',
    ],
    write: [],
  },
};

let _initialized = false;

export async function requestHealthPermissions(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return false;
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(PERMISSIONS, (error: any) => {
      if (error) { resolve(false); return; }
      _initialized = true;
      resolve(true);
    });
  });
}

export async function getMostRecentWorkout(): Promise<WorkoutData | null> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return null;

  if (!_initialized) {
    const ok = await requestHealthPermissions();
    if (!ok) return null;
  }

  const options = {
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // last 24h
    endDate: new Date().toISOString(),
    ascending: false,
    limit: 1,
  };

  return new Promise((resolve) => {
    AppleHealthKit.getSamples(
      { ...options, type: 'Workout' },
      (error: any, results: any[]) => {
        if (error || !results?.length) { resolve(null); return; }
        const w = results[0];
        resolve({
          caloriesBurned: Math.round(w.calories ?? w.activeEnergyBurned ?? 0),
          duration: Math.round((w.duration ?? 0) / 60),
          heartRate: w.heartRate ?? null,
          workoutType: w.activityName ?? 'Workout',
          startDate: w.startDate ?? new Date().toISOString(),
        });
      },
    );
  });
}
