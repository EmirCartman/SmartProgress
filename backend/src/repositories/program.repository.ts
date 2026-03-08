// ─────────────────────────────────────────────
// Program Repository
// ─────────────────────────────────────────────
import { Prisma, Program } from "@prisma/client";
import prisma from "../config/prisma";

export class ProgramRepository {
    /**
     * Create a new program.
     */
    async create(data: Prisma.ProgramCreateInput): Promise<Program> {
        return prisma.program.create({ data });
    }

    /**
     * Find a program by ID.
     */
    async findById(id: string): Promise<Program | null> {
        return prisma.program.findUnique({
            where: { id },
        });
    }

    /**
     * Update program visibility (public/private).
     */
    async updateVisibility(id: string, isPublic: boolean): Promise<Program> {
        return prisma.program.update({
            where: { id },
            data: { isPublic },
        });
    }

    /**
     * Get all public programs with user info.
     */
    async findPublicPrograms(
        limit = 20,
        offset = 0,
    ): Promise<Program[]> {
        return prisma.program.findMany({
            where: { isPublic: true },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Get programs by user ID.
     */
    async findByUserId(userId: string): Promise<Program[]> {
        return prisma.program.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
}

export const programRepository = new ProgramRepository();
