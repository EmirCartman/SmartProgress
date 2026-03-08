// ─────────────────────────────────────────────
// Auto-Regulation Service
// ─────────────────────────────────────────────
// Simple rule-based weight suggestion algorithm:
// - Analyzes the user's last workout logs for a given exercise
// - If target rep range was achieved → suggest +2.5% to +5% weight
// - If target rep range was NOT achieved → suggest same weight
// - Only active when user.settings.is_auto_suggest_enabled === true
// ─────────────────────────────────────────────
import { userRepository } from "../repositories/user.repository";
import { workoutRepository } from "../repositories/workout.repository";
import { NotFoundError, BadRequestError } from "../utils/errors";

// ─── Types ───────────────────────────────────

interface SetData {
    reps: number;
    weight: number;
    unit: string;
}

interface ExerciseData {
    name: string;
    sets: SetData[];
}

interface WorkoutData {
    exercises?: ExerciseData[];
}

export interface WeightSuggestion {
    exerciseName: string;
    lastWeight: number;
    lastReps: number;
    suggestedWeight: number;
    unit: string;
    reasoning: string;
}

// ─── Configuration ───────────────────────────

const TARGET_REP_MIN = 8;
const TARGET_REP_MAX = 12;
const WEIGHT_INCREMENT_PERCENTAGE = 0.025; // 2.5%

// ─── Service ─────────────────────────────────

export class AutoRegulationService {
    /**
     * Suggest the next set weight for a given exercise.
     *
     * Algorithm:
     * 1. Check if auto-suggest is enabled in user settings
     * 2. Find the user's latest workout containing the exercise
     * 3. Look at the last set performed
     * 4. If reps >= TARGET_REP_MAX → increase weight by 2.5%
     * 5. If reps >= TARGET_REP_MIN → suggest same weight
     * 6. If reps < TARGET_REP_MIN → suggest reducing weight by 2.5%
     */
    async suggestNextSet(
        userId: string,
        exerciseName: string,
    ): Promise<WeightSuggestion> {
        // 1. Check user settings
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        const settings = user.settings as Record<string, unknown> | null;
        if (!settings || settings.is_auto_suggest_enabled !== true) {
            throw new BadRequestError(
                "Auto-suggestion is disabled. Enable it in your settings.",
            );
        }

        // 2. Find latest workouts containing this exercise
        const recentLogs = await workoutRepository.findLatestByExercise(
            userId,
            exerciseName,
            5,
        );

        if (recentLogs.length === 0) {
            throw new NotFoundError(
                `No previous workout data found for exercise: ${exerciseName}`,
            );
        }

        // 3. Extract the last set from the most recent workout
        const latestLog = recentLogs[0];
        const workoutData = latestLog.data as WorkoutData;

        if (!workoutData.exercises) {
            throw new NotFoundError("No exercise data in the latest workout");
        }

        const exercise = workoutData.exercises.find(
            (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
        );

        if (!exercise || exercise.sets.length === 0) {
            throw new NotFoundError(
                `No set data found for exercise: ${exerciseName}`,
            );
        }

        const lastSet = exercise.sets[exercise.sets.length - 1];

        // 4. Apply auto-regulation logic
        let suggestedWeight: number;
        let reasoning: string;

        if (lastSet.reps >= TARGET_REP_MAX) {
            // Target range exceeded → increase weight
            const increment = Math.ceil(lastSet.weight * WEIGHT_INCREMENT_PERCENTAGE * 4) / 4;
            suggestedWeight = lastSet.weight + Math.max(increment, 2.5);
            reasoning = `Son sette ${lastSet.reps} tekrar yapıldı (hedef: ${TARGET_REP_MAX}). Ağırlık artırılması önerilir.`;
        } else if (lastSet.reps >= TARGET_REP_MIN) {
            // Within target range → keep same weight
            suggestedWeight = lastSet.weight;
            reasoning = `Son sette ${lastSet.reps} tekrar yapıldı (hedef aralık: ${TARGET_REP_MIN}-${TARGET_REP_MAX}). Aynı ağırlıkta devam edilmesi önerilir.`;
        } else {
            // Below target range → reduce weight
            const decrement = Math.ceil(lastSet.weight * WEIGHT_INCREMENT_PERCENTAGE * 4) / 4;
            suggestedWeight = Math.max(lastSet.weight - decrement, 0);
            reasoning = `Son sette ${lastSet.reps} tekrar yapıldı (hedef minimum: ${TARGET_REP_MIN}). Ağırlık azaltılması önerilir.`;
        }

        return {
            exerciseName,
            lastWeight: lastSet.weight,
            lastReps: lastSet.reps,
            suggestedWeight,
            unit: lastSet.unit || "kg",
            reasoning,
        };
    }
}

export const autoRegulationService = new AutoRegulationService();
