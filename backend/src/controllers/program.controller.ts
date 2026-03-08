// ─────────────────────────────────────────────
// Program Controller
// ─────────────────────────────────────────────
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { programService } from "../services/program.service";
import { autoRegulationService } from "../services/autoRegulation.service";
import { ValidationError } from "../utils/errors";

// ─── Zod Schemas ─────────────────────────────

const createProgramSchema = z.object({
    name: z
        .string()
        .min(1, "Program name is required")
        .max(100, "Program name must not exceed 100 characters"),
    description: z.string().max(1000).optional(),
    isPublic: z.boolean().optional(),
    data: z.any().optional(),
});

// ─── Controller ──────────────────────────────

export class ProgramController {
    /**
     * POST /
     * Create a new program.
     */
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;

            const parsed = createProgramSchema.safeParse(req.body);
            if (!parsed.success) {
                throw new ValidationError("Validation failed", parsed.error.flatten());
            }

            const program = await programService.createProgram(userId, parsed.data);
            res.status(201).json(program);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /:id/visibility
     * Toggle program public/private.
     */
    async toggleVisibility(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.user!.userId;
            const programId = req.params.id as string;

            const program = await programService.toggleVisibility(userId, programId);
            res.status(200).json({
                message: `Program is now ${program.isPublic ? "public" : "private"}`,
                program,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /public
     * List all public programs (community feed).
     */
    async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
            const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

            const programs = await programService.getPublicPrograms(limit, offset);
            res.status(200).json({
                count: programs.length,
                programs,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /mine
     * List user's own programs.
     */
    async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const programs = await programService.getUserPrograms(userId);
            res.status(200).json({
                count: programs.length,
                programs,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /:id
     * Get a specific program by ID.
     */
    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user!.userId;
            const programId = req.params.id as string;
            const program = await programService.getProgramById(userId, programId);
            res.status(200).json(program);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /suggest/:exerciseName
     * Auto-regulation weight suggestion.
     */
    async suggestWeight(
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> {
        try {
            const userId = req.user!.userId;
            const exerciseName = decodeURIComponent(req.params.exerciseName as string);

            const suggestion = await autoRegulationService.suggestNextSet(
                userId,
                exerciseName,
            );

            res.status(200).json(suggestion);
        } catch (error) {
            next(error);
        }
    }
}

export const programController = new ProgramController();
