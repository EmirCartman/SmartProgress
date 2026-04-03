import { PrismaClient } from "@prisma/client";

async function run() {
    const prisma = new PrismaClient();
    try {
        const programId = "b9c34f17-ed89-4d0f-a54a-009a7d503632";
        const program = await prisma.program.findUnique({ where: { id: programId } });

        if (!program) {
            console.log("Program not found in DB.");
            return;
        }

        console.log("Program Data inside DB:");
        console.log(JSON.stringify(program.data, null, 2));

    } finally {
        await prisma.$disconnect();
    }
}
run();
