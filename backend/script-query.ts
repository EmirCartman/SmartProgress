import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    console.log("Programs:", await prisma.program.findMany({ select: { id: true, name: true, userId: true }, take: 5 }));
}
main().finally(() => prisma.$disconnect());
