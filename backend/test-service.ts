import { programService } from "./src/services/program.service";
import prisma from "./src/config/prisma";

async function run() {
    const user = await prisma.user.findFirst();
    const program = await prisma.program.findFirst({ where: { id: "36afe4ba-0f90-40aa-a5be-0e4a7ed82f34" } });

    console.log("DB User found:", user?.id);
    console.log("DB Program found:", program?.id);

    if (!user || !program) return;

    try {
        const result = await programService.getProgramById(user.id, program.id);
        console.log("getProgramById SUCCESS:", result.id);
    } catch (e: any) {
        console.error("getProgramById ERROR:", e.message);
    }
}

run().finally(() => prisma.$disconnect());
