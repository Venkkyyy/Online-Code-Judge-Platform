import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.collabSession.findMany().then(console.log).finally(() => prisma.$disconnect());
