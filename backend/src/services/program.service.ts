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
    frequency?: number; // sessions per week (for cycle-based programs)
    data?: any;         // CycleProgramData | legacy exercises array
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
            frequency: dto.frequency ?? 7,
            data: dto.data ?? null,
            currentDayIndex: 0,
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
        console.log(`[ProgramService] getProgramById: userId=${userId}, programId=${programId}`);
        const program = await programRepository.findById(programId);
        if (!program) {
            console.warn(`[ProgramService] getProgramById: Program NOT FOUND in DB. programId=${programId}`);
            throw new NotFoundError("Program not found");
        }
        console.log(`[ProgramService] getProgramById: Found program. owner=${program.userId}, isPublic=${program.isPublic}, hasData=${!!program.data}`);
        if (!program.isPublic && program.userId !== userId) {
            console.warn(`[ProgramService] getProgramById: ACCESS DENIED. requestUserId=${userId}, ownerUserId=${program.userId}`);
            throw new ForbiddenError("You don't have access to this program");
        }
        return program;
    }

    /**
     * Advance the currentDayIndex by 1, wrapping around modulo total days.
     * Only the program owner can advance the day.
     */
    async advanceDayIndex(userId: string, programId: string): Promise<Program> {
        const program = await programRepository.findById(programId);
        if (!program) {
            throw new NotFoundError("Program not found");
        }
        if (program.userId !== userId) {
            throw new ForbiddenError("You can only modify your own programs");
        }

        // Determine total days from JSONB data
        const data = program.data as any;
        const totalDays =
            Array.isArray(data?.days) && data.days.length > 0
                ? data.days.length
                : 1;

        const nextIndex = (program.currentDayIndex + 1) % totalDays;
        return programRepository.updateDayIndex(programId, nextIndex);
    }

    /**
     * Update a program. Only the owner can update.
     */
    async updateProgram(
        userId: string,
        programId: string,
        dto: Partial<CreateProgramDto>,
    ): Promise<Program> {
        const program = await programRepository.findById(programId);
        if (!program) {
            throw new NotFoundError("Program not found");
        }
        if (program.userId !== userId) {
            throw new ForbiddenError("You can only modify your own programs");
        }

        const updateData: any = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.isPublic !== undefined) updateData.isPublic = dto.isPublic;
        if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
        if (dto.data !== undefined) updateData.data = dto.data;

        return programRepository.update(programId, updateData);
    }

    /**
     * Delete a program. Only the owner can delete.
     */
    async deleteProgram(userId: string, programId: string): Promise<Program> {
        const program = await programRepository.findById(programId);
        if (!program) {
            throw new NotFoundError("Program not found");
        }
        if (program.userId !== userId) {
            throw new ForbiddenError("You can only delete your own programs");
        }
        return programRepository.deleteById(programId);
    }
}

export const programService = new ProgramService();
