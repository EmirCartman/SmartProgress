import { PrismaClient } from "@prisma/client";

async function run() {
    const prisma = new PrismaClient();
    try {
        const p = await prisma.program.findFirst({
            orderBy: { createdAt: "desc" }
        });
        if (!p) {
            console.log("No programs found.");
            return;
        }
        console.log(`Latest Program Name: ${p.name}`);
        console.log(`hasData: ${p.data ? true : false}`);
        if (p.data) {
            console.log(JSON.stringify(p.data, null, 2));
        }
    } finally {
        await prisma.$disconnect();
    }
}
run();
