import { PrismaClient } from "@prisma/client";

async function run() {
    const prisma = new PrismaClient();
    try {
        const sportId = "00000000-0000-0000-0000-000000000001";
        const sport = await prisma.sport.findUnique({ where: { id: sportId } });

        if (!sport) {
            console.log("Sport NOT FOUND in DB.");
            
            // Also print all available sports
            const sports = await prisma.sport.findMany();
            console.log("Available sports:", sports);
        } else {
            console.log("Sport found:", sport);
        }

    } finally {
        await prisma.$disconnect();
    }
}
run();
