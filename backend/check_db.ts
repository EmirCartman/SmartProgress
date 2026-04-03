import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function check() {
  const p = await prisma.program.findFirst({ orderBy: { createdAt: 'desc' } });
  if (p) {
    console.log("Program ID:", p.id);
    console.log("Data is null?:", p.data === null);
    if (p.data) {
      console.log("Data:", JSON.stringify(p.data).substring(0, 100));
    }
  } else {
    console.log("No programs found.");
  }
}

check().finally(() => prisma.$disconnect());
