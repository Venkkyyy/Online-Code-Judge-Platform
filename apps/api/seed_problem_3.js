const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.problem.update({
    where: { id: 3 },
    data: {
      templates: {
        python: `def sum_of_two(a, b):\n    # Write your code here\n    pass`,
        javascript: `function sumOfTwo(a, b) {\n    // Write your code here\n}`,
        java: `class Solution {\n    public int sumOfTwo(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    int sumOfTwo(int a, int b) {\n        // Write your code here\n        return 0;\n    }\n};`
      }
    }
  });

  await prisma.testCase.deleteMany({
    where: { problemId: 3 }
  });

  const testCases = [
    { input: "1 2", expectedOutput: "3", isHidden: false },
    { input: "10 20", expectedOutput: "30", isHidden: false },
    { input: "-5 5", expectedOutput: "0", isHidden: true },
    { input: "100 -50", expectedOutput: "50", isHidden: true },
    { input: "0 0", expectedOutput: "0", isHidden: true },
    { input: "-10 -20", expectedOutput: "-30", isHidden: true },
    { input: "9999 1", expectedOutput: "10000", isHidden: true },
    { input: "123 456", expectedOutput: "579", isHidden: true },
    { input: "-999 999", expectedOutput: "0", isHidden: true },
    { input: "42 0", expectedOutput: "42", isHidden: true }
  ];

  for (const tc of testCases) {
    await prisma.testCase.create({
      data: {
        problemId: 3,
        ...tc
      }
    });
  }

  console.log("Seeded Problem 3 successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
