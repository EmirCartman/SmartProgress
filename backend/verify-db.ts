import { PrismaClient } from "@prisma/client";

async function run() {
    const prisma = new PrismaClient();
    try {
        const programId = "36afe4ba-0f90-40aa-a5be-0e4a7ed82f34";
        const program = await prisma.program.findUnique({ where: { id: programId } });
        if (!program) {
            console.log(`Program ${programId} NOT FOUND in DB.`);
        } else {
            console.log(`Program found:`, {
                id: program.id,
                name: program.name,
                userId: program.userId,
                isPublic: program.isPublic,
                hasData: !!program.data,
            });
            const user = await prisma.user.findUnique({ where: { id: program.userId } });
            console.log(`Owner:`, user ? `${user.email} (id: ${user.id})` : "No user found");
        }
    } finally {
        await prisma.$disconnect();
    }
}
run();
