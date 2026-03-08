// ─────────────────────────────────────────────
// Workout Controller
// ─────────────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import { workoutService } from "../services/workout.service";

export class WorkoutController {
    /**
     * POST /sync
     * Bulk-sync workout logs from mobile app.
     */
    async sync(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;

            // Validate input
            const input = workoutService.validateSyncInput(req.body);

            // Sync workouts (transactional with outbox)
            const createdLogs = await workoutService.syncWorkouts(userId, input);

            res.status(201).json({
                message: `Successfully synced ${createdLogs.length} workout(s)`,
                count: createdLogs.length,
                workouts: createdLogs,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /
     * Get user's workout logs with optional pagination.
     */
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
            const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

            const workouts = await workoutService.getUserWorkouts(userId, limit, offset);

            res.status(200).json({
                count: workouts.length,
                workouts,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const workoutController = new WorkoutController();
