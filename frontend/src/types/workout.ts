// ─────────────────────────────────────────────
// SmartProgress — Workout Type Definitions
// Antrenman akışı için tüm tip tanımları
// ─────────────────────────────────────────────

// ─── Set ─────────────────────────────────────

export interface WorkoutSet {
    id: string;
    weight: number;
    reps: number;
    unit: "kg" | "lbs";
    rpe?: number; // Rate of Perceived Exertion (1-10)
    completed: boolean;
}

// ─── Exercise ────────────────────────────────

export interface WorkoutExercise {
    id: string;
    name: string;
    sets: WorkoutSet[];
}

// ─── Session ─────────────────────────────────

export type SessionStatus = "active" | "completed" | "cancelled";

export interface WorkoutSession {
    id: string;
    title: string;
    sportId: string;
    exercises: WorkoutExercise[];
    startedAt: string; // ISO 8601
    completedAt?: string; // ISO 8601
    totalDuration: number; // seconds
    status: SessionStatus;
}

// ─── Sync ────────────────────────────────────

export type SyncStatus = "pending" | "syncing" | "synced" | "failed";

export interface PendingWorkout {
    id: string;
    session: WorkoutSession;
    syncStatus: SyncStatus;
    createdAt: string; // ISO 8601
    lastSyncAttempt?: string; // ISO 8601
    failCount: number;
}

// ─── API Payload ─────────────────────────────
// POST /api/v1/workouts/sync body format

export interface SyncWorkoutPayload {
    sportId: string;
    title: string;
    notes?: string;
    data: {
        exercises: {
            name: string;
            sets: {
                reps: number;
                weight: number;
                unit: "kg" | "lbs";
            }[];
        }[];
        totalDuration?: number;
    };
    logDate: string; // ISO 8601
}

// ─── AsyncStorage Keys ──────────────────────

export const STORAGE_KEYS = {
    ACTIVE_SESSION: "active_workout_session",
    PENDING_WORKOUTS: "pending_workouts",
} as const;
