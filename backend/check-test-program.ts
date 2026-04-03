import { PrismaClient } from "@prisma/client";
async function run() {
    const prisma = new PrismaClient();
    try {
        const testP = await prisma.program.findFirst({ where: { name: "Test Has Data Program" } });
        console.log("Test Program data:", testP ? testP.data : "Not found");

        const yeniP = await prisma.program.findFirst({ where: { name: "yeni" }, orderBy: { createdAt: "desc" } });
        console.log("Yeni Program data:", yeniP ? yeniP.data : "Not found");
        console.log("Yeni Program createdAt:", yeniP ? yeniP.createdAt : "Not found");
    } finally {
        await prisma.$disconnect();
    }
}
run();
