import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
    await prisma.sport.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Fitness',
            slug: 'fitness',
            icon: 'barbell'
        }
    });
    console.log('Sport seeded successfully');
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
