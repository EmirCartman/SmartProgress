// ─────────────────────────────────────────────
// Program Service
// ─────────────────────────────────────────────
import { Program } from "@prisma/client";
import { programRepository } from "../repositories/program.repository";
import { NotFoundError, ForbiddenError } from "../utils/errors";

// ─── DTOs ────────────────────────────────────

export interface CreateProgramDto {
    name: string;
    description?: string;
    isPublic?: boolean;
    data?: any;
}

// ─── Service ─────────────────────────────────

export class ProgramService {
    /**
     * Create a new program for a user.
     */
    async createProgram(
        userId: string,
        dto: CreateProgramDto,
    ): Promise<Program> {
        return programRepository.create({
            name: dto.name,
            description: dto.description,
            isPublic: dto.isPublic ?? false,
            data: dto.data ?? null,
            user: { connect: { id: userId } },
        });
    }

    /**
     * Toggle program visibility (public/private).
     * Only the owner can change visibility.
     */
    async toggleVisibility(
        userId: string,
        programId: string,
    ): Promise<Program> {
        const program = await programRepository.findById(programId);

        if (!program) {
            throw new NotFoundError("Program not found");
        }

        if (program.userId !== userId) {
            throw new ForbiddenError("You can only modify your own programs");
        }

        return programRepository.updateVisibility(programId, !program.isPublic);
    }

    /**
     * Get all public programs (community feed).
     */
    async getPublicPrograms(limit?: number, offset?: number): Promise<Program[]> {
        return programRepository.findPublicPrograms(limit, offset);
    }

    /**
     * Get programs by user ID.
     */
    async getUserPrograms(userId: string): Promise<Program[]> {
        return programRepository.findByUserId(userId);
    }

    /**
     * Get a specific program by ID, ensuring user has access.
     */
    async getProgramById(userId: string, programId: string): Promise<Program> {
        const program = await programRepository.findById(programId);
        if (!program) {
            throw new NotFoundError("Program not found");
        }
        if (!program.isPublic && program.userId !== userId) {
            throw new ForbiddenError("You don't have access to this program");
        }
        return program;
    }
}

export const programService = new ProgramService();
