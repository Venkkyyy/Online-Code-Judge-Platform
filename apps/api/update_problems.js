const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateProblems() {
  await prisma.problem.update({
    where: { id: 4 },
    data: { difficulty: 'Easy', tags: ['Array', 'Hash Table'] }
  });
  await prisma.problem.update({
    where: { id: 5 },
    data: { difficulty: 'Easy', tags: ['Two Pointers', 'String'] }
  });
  await prisma.problem.update({
    where: { id: 6 },
    data: { difficulty: 'Easy', tags: ['Math'] }
  });
  await prisma.problem.update({
    where: { id: 7 },
    data: { difficulty: 'Medium', tags: ['Array', 'Dynamic Programming'] }
  });
  await prisma.problem.update({
    where: { id: 8 },
    data: { difficulty: 'Easy', tags: ['Math', 'Dynamic Programming', 'Memoization'] }
  });
  console.log("Problems updated successfully!");
}

updateProblems().catch(console.error).finally(() => prisma.$disconnect());
