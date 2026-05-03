export interface WorkoutTemplate {
  id: string;
  name: string;
  daysOfWeek: number[];
  category: string;
}

export interface Exercise {
  id: string;
  name: string;
  order: number;
  weight: number;
  reps: number;
  sets: number;
  restTime: number;
  videoUrl?: string;
}

export interface ExecutionLog {
  id: string;
  workoutId: string;
  date: string; // ISO timestamp from PostgreSQL
  workoutName?: string;
  data?: Record<string, SetRecord[]>;
  duration?: number;
}

export interface SetRecord {
  reps: number;
  weight: number;
  completedAt: Date;
}

export interface SuggestedWorkout {
  name: string;
  category: string;
  daysOfWeek: number[];
  exercises: {
    name: string;
    sets: number;
    reps: number;
    weight: number;
    restTime: number;
  }[];
}
