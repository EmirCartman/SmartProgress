import { programRepository } from "./src/repositories/program.repository";
import { PrismaClient } from "@prisma/client";
import { programService } from "./src/services/program.service";

async function run() {
    const prisma = new PrismaClient();
    try {
        const u = await prisma.user.findFirst();
        if(!u) return console.log("No user");

        const progs = await prisma.program.findMany({ take: 1 });
        if(progs.length === 0) return console.log("No programs");

        console.log("Found program ID:", progs[0].id);

        try {
            const fetched = await programService.getProgramById(u.id, progs[0].id);
            console.log("Service fetched properly:", fetched.id);
        } catch(e) {
            console.log("Service failed:", e);
        }

    } finally {
        await prisma.$disconnect();
    }
}
run();
