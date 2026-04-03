import { PrismaClient } from "@prisma/client";

async function run() {
    const prisma = new PrismaClient();
    try {
        const programs = await prisma.program.findMany();
        console.log(`Found ${programs.length} programs`);
        for (const p of programs) {
            console.log(`- ID: ${p.id} | Name: ${p.name} | hasData: ${p.data ? true : false}`);
            if (p.data) console.log(JSON.stringify(p.data).substring(0, 100));
        }
    } finally {
        await prisma.$disconnect();
    }
}
run();
