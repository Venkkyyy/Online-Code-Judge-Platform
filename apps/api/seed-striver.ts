import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate large numbers of test cases programmatically
function generateTestCases(count: number, generatorFn: (i: number) => { input: string, expectedOutput: string }, isHiddenRatio = 0.8) {
  const cases = [];
  const hiddenCount = Math.floor(count * isHiddenRatio);
  
  for (let i = 0; i < count; i++) {
    const { input, expectedOutput } = generatorFn(i);
    cases.push({
      input: String(input),
      expectedOutput: String(expectedOutput),
      isHidden: i >= (count - hiddenCount) // First 20% are visible
    });
  }
  return cases;
}

const problems = [
  {
    title: "Count Digits",
    difficulty: "Easy",
    description: "Given a number N. Count the number of digits in N which evenly divide N.\n\nExample 1:\nInput: N = 12\nOutput: 2\nExplanation: 1, 2 both divide 12 evenly\n\nExample 2:\nInput: N = 23\nOutput: 0\nExplanation: 2 and 3 do not divide 23 evenly\n\nConstraints:\n1 <= N <= 10^5",
    tags: ["Math", "Basic"],
    acceptance: 85.5,
    published: true,
    templates: {
      python: "class Solution:\n    def countDigits(self, n: int) -> int:\n        # Write your code here\n        pass\n",
      javascript: "class Solution {\n    countDigits(n) {\n        // Write your code here\n    }\n}\n",
      cpp: "class Solution {\npublic:\n    int countDigits(int n) {\n        // Write your code here\n    }\n};\n",
      java: "class Solution {\n    public int countDigits(int n) {\n        // Write your code here\n    }\n}\n"
    },
    testCases: generateTestCases(50, (i) => {
      // Custom test cases
      if (i === 0) return { input: "12", expectedOutput: "2" };
      if (i === 1) return { input: "23", expectedOutput: "0" };
      if (i === 2) return { input: "2446", expectedOutput: "1" }; 
      
      const n = Math.floor(Math.random() * 100000) + 1;
      let count = 0;
      let temp = n;
      while (temp > 0) {
        let d = temp % 10;
        if (d > 0 && n % d === 0) count++;
        temp = Math.floor(temp / 10);
      }
      return { input: `${n}`, expectedOutput: `${count}` };
    })
  },
  {
    title: "Reverse a Number",
    difficulty: "Easy",
    description: "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.\n\nExample 1:\nInput: x = 123\nOutput: 321\n\nExample 2:\nInput: x = -123\nOutput: -321",
    tags: ["Math"],
    acceptance: 75.2,
    published: true,
    templates: {
      python: "class Solution:\n    def reverse(self, x: int) -> int:\n        pass\n",
      javascript: "class Solution {\n    reverse(x) {\n        \n    }\n}\n",
      cpp: "class Solution {\npublic:\n    int reverse(int x) {\n        \n    }\n};\n",
      java: "class Solution {\n    public int reverse(int x) {\n        \n    }\n}\n"
    },
    testCases: generateTestCases(50, (i) => {
      if (i === 0) return { input: "123", expectedOutput: "321" };
      if (i === 1) return { input: "-123", expectedOutput: "-321" };
      if (i === 2) return { input: "120", expectedOutput: "21" };
      
      let x = Math.floor(Math.random() * 1000000);
      if (Math.random() > 0.5) x = -x;
      
      let rev = parseInt(Math.abs(x).toString().split('').reverse().join(''));
      if (x < 0) rev = -rev;
      if (rev > Math.pow(2, 31) - 1 || rev < -Math.pow(2, 31)) rev = 0;
      
      return { input: `${x}`, expectedOutput: `${rev}` };
    })
  },
  {
    title: "Check Palindrome",
    difficulty: "Easy",
    description: "Given an integer x, return true if x is a palindrome, and false otherwise.\n\nExample 1:\nInput: x = 121\nOutput: true\n\nExample 2:\nInput: x = -121\nOutput: false\nExplanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.",
    tags: ["Math"],
    acceptance: 92.1,
    published: true,
    templates: {
      python: "class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        pass\n",
      javascript: "class Solution {\n    isPalindrome(x) {\n        \n    }\n}\n",
      cpp: "class Solution {\npublic:\n    bool isPalindrome(int x) {\n        \n    }\n};\n",
      java: "class Solution {\n    public boolean isPalindrome(int x) {\n        \n    }\n}\n"
    },
    testCases: generateTestCases(40, (i) => {
      if (i === 0) return { input: "121", expectedOutput: "true" };
      if (i === 1) return { input: "-121", expectedOutput: "false" };
      if (i === 2) return { input: "10", expectedOutput: "false" };
      
      let x = Math.floor(Math.random() * 10000);
      if (i % 2 === 0) {
        const str = x.toString();
        x = parseInt(str + str.split('').reverse().join(''));
      }
      const s = String(x);
      const isPal = s === s.split('').reverse().join('');
      return { input: `${x}`, expectedOutput: isPal ? "true" : "false" };
    })
  },
  {
    title: "GCD or HCF",
    difficulty: "Easy",
    description: "Given two integers A and B, find their Greatest Common Divisor (GCD) or Highest Common Factor (HCF).\n\nExample 1:\nInput: A = 4, B = 8\nOutput: 4\n\nExample 2:\nInput: A = 3, B = 6\nOutput: 3",
    tags: ["Math"],
    acceptance: 88.0,
    published: true,
    templates: {
      python: "class Solution:\n    def gcd(self, a: int, b: int) -> int:\n        pass\n",
      javascript: "class Solution {\n    gcd(a, b) {\n        \n    }\n}\n",
      cpp: "class Solution {\npublic:\n    int gcd(int a, int b) {\n        \n    }\n};\n",
      java: "class Solution {\n    public int gcd(int a, int b) {\n        \n    }\n}\n"
    },
    testCases: generateTestCases(40, (i) => {
      if (i === 0) return { input: "4\n8", expectedOutput: "4" };
      if (i === 1) return { input: "3\n6", expectedOutput: "3" };
      
      const a = Math.floor(Math.random() * 1000) + 1;
      const b = Math.floor(Math.random() * 1000) + 1;
      let x = Math.abs(a);
      let y = Math.abs(b);
      while (y) {
        let t = y;
        y = x % y;
        x = t;
      }
      return { input: `${a}\n${b}`, expectedOutput: `${x}` };
    })
  },
  {
    title: "Armstrong Number",
    difficulty: "Easy",
    description: "Given an integer N, return true if it is an Armstrong number otherwise return false.\nAn Armstrong number is a number that is equal to the sum of cubes of its digits.\n\nExample 1:\nInput: N = 153\nOutput: true\nExplanation: 1^3 + 5^3 + 3^3 = 1 + 125 + 27 = 153\n\nExample 2:\nInput: N = 170\nOutput: false",
    tags: ["Math"],
    acceptance: 91.0,
    published: true,
    templates: {
      python: "class Solution:\n    def isArmstrong(self, n: int) -> bool:\n        pass\n",
      javascript: "class Solution {\n    isArmstrong(n) {\n        \n    }\n}\n",
      cpp: "class Solution {\npublic:\n    bool isArmstrong(int n) {\n        \n    }\n};\n",
      java: "class Solution {\n    public boolean isArmstrong(int n) {\n        \n    }\n}\n"
    },
    testCases: generateTestCases(40, (i) => {
      if (i === 0) return { input: "153", expectedOutput: "true" };
      if (i === 1) return { input: "170", expectedOutput: "false" };
      if (i === 2) return { input: "370", expectedOutput: "true" };
      
      const n = Math.floor(Math.random() * 1000);
      const str = String(n);
      let sum = 0;
      for (let char of str) {
        sum += Math.pow(parseInt(char), 3);
      }
      return { input: `${n}`, expectedOutput: sum === n ? "true" : "false" };
    })
  }
];

async function seed() {
  console.log("Wiping existing DB...");
  await prisma.submission.deleteMany({});
  await prisma.collabSession.deleteMany({});
  await prisma.testCase.deleteMany({});
  await prisma.problem.deleteMany({});
  
  console.log("Seeding Striver's Problems...");
  for (const prob of problems) {
    const { testCases, ...problemData } = prob;
    const created = await prisma.problem.create({
      data: {
        ...problemData,
        testCases: {
          create: testCases
        }
      }
    });
    console.log(`Created problem: ${created.title} with ${testCases.length} test cases`);
  }
  
  console.log("Seeding complete!");
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
