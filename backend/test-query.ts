import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
    const progs = await prisma.program.findMany();
    for (const p of progs) {
        console.log(`ID: ${p.id}, Data Is Null: ${p.data === null}, Data:`, JSON.stringify(p.data).substring(0, 100));
    }
}
check().finally(() => prisma.$disconnect());
