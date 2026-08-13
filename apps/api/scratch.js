const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.problem.findUnique({where: {id: 3}}).then(p => console.log(JSON.stringify(p, null, 2))).finally(() => prisma.$disconnect());
