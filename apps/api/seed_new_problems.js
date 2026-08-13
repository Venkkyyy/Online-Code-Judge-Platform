const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const problems = [
    {
      title: "Two Sum",
      difficulty: "EASY",
      description: "<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to <code>target</code></em>.</p><p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p><p><strong>Example:</strong><br>Input: nums = [2,7,11,15], target = 9<br>Output: [0,1]</p>",
      published: true,
      templates: {
        python: `def twoSum(nums, target):\n    # Write your code here\n    pass`,
        javascript: `function twoSum(nums, target) {\n    // Write your code here\n}`,
        java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}`,
        cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};`
      },
      testCases: [
        { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
        { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false },
        { input: "[3,3]\n6", expectedOutput: "[0,1]", isHidden: false },
        { input: "[2,5,5,11]\n10", expectedOutput: "[1,2]", isHidden: true },
        { input: "[-1,-2,-3,-4,-5]\n-8", expectedOutput: "[2,4]", isHidden: true },
        { input: "[150,24,79,50,88,345,3]\n200", expectedOutput: "[0,3]", isHidden: true }
      ]
    },
    {
      title: "Reverse String",
      difficulty: "EASY",
      description: "<p>Write a function that reverses a string. The input string is given as an array of characters <code>s</code>.</p><p>You must do this by modifying the input array in-place with O(1) extra memory.</p><p><strong>Example:</strong><br>Input: s = [\"h\",\"e\",\"l\",\"l\",\"o\"]<br>Output: [\"o\",\"l\",\"l\",\"e\",\"h\"]</p>",
      published: true,
      templates: {
        python: `def reverseString(s):\n    # Write your code here\n    pass`,
        javascript: `function reverseString(s) {\n    // Write your code here\n}`,
        java: `class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n    }\n}`,
        cpp: `class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n    }\n};`
      },
      testCases: [
        { input: "[\"h\",\"e\",\"l\",\"l\",\"o\"]", expectedOutput: "[\"o\",\"l\",\"l\",\"e\",\"h\"]", isHidden: false },
        { input: "[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", expectedOutput: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]", isHidden: false },
        { input: "[\"a\"]", expectedOutput: "[\"a\"]", isHidden: true },
        { input: "[\" \",\" \"]", expectedOutput: "[\" \",\" \"]", isHidden: true },
        { input: "[\"r\",\"a\",\"c\",\"e\",\"c\",\"a\",\"r\"]", expectedOutput: "[\"r\",\"a\",\"c\",\"e\",\"c\",\"a\",\"r\"]", isHidden: true },
        { input: "[\"1\",\"2\",\"3\",\"4\",\"5\"]", expectedOutput: "[\"5\",\"4\",\"3\",\"2\",\"1\"]", isHidden: true }
      ]
    },
    {
      title: "Palindrome Number",
      difficulty: "EASY",
      description: "<p>Given an integer <code>x</code>, return <code>true</code> if <code>x</code> is a <em>palindrome</em>, and <code>false</code> otherwise.</p><p><strong>Example:</strong><br>Input: x = 121<br>Output: true</p><p>Input: x = -121<br>Output: false</p>",
      published: true,
      templates: {
        python: `def isPalindrome(x):\n    # Write your code here\n    pass`,
        javascript: `function isPalindrome(x) {\n    // Write your code here\n}`,
        java: `class Solution {\n    public boolean isPalindrome(int x) {\n        // Write your code here\n        return false;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    bool isPalindrome(int x) {\n        // Write your code here\n        return false;\n    }\n};`
      },
      testCases: [
        { input: "121", expectedOutput: "true", isHidden: false },
        { input: "-121", expectedOutput: "false", isHidden: false },
        { input: "10", expectedOutput: "false", isHidden: false },
        { input: "0", expectedOutput: "true", isHidden: true },
        { input: "123454321", expectedOutput: "true", isHidden: true },
        { input: "1000000001", expectedOutput: "true", isHidden: true },
        { input: "123456", expectedOutput: "false", isHidden: true }
      ]
    },
    {
      title: "Maximum Subarray",
      difficulty: "MEDIUM",
      description: "<p>Given an integer array <code>nums</code>, find the subarray with the largest sum, and return <em>its sum</em>.</p><p><strong>Example:</strong><br>Input: nums = [-2,1,-3,4,-1,2,1,-5,4]<br>Output: 6<br>Explanation: The subarray [4,-1,2,1] has the largest sum 6.</p>",
      published: true,
      templates: {
        python: `def maxSubArray(nums):\n    # Write your code here\n    pass`,
        javascript: `function maxSubArray(nums) {\n    // Write your code here\n}`,
        java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your code here\n        return 0;\n    }\n};`
      },
      testCases: [
        { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isHidden: false },
        { input: "[1]", expectedOutput: "1", isHidden: false },
        { input: "[5,4,-1,7,8]", expectedOutput: "23", isHidden: false },
        { input: "[-1]", expectedOutput: "-1", isHidden: true },
        { input: "[-100,-200,-300]", expectedOutput: "-100", isHidden: true },
        { input: "[0,0,0]", expectedOutput: "0", isHidden: true },
        { input: "[8,-19,5,-4,20]", expectedOutput: "21", isHidden: true }
      ]
    },
    {
      title: "Fibonacci Number",
      difficulty: "EASY",
      description: "<p>The Fibonacci numbers, commonly denoted <code>F(n)</code> form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from <code>0</code> and <code>1</code>.</p><p>Given <code>n</code>, calculate <code>F(n)</code>.</p><p><strong>Example:</strong><br>Input: n = 2<br>Output: 1</p><p>Input: n = 4<br>Output: 3</p>",
      published: true,
      templates: {
        python: `def fib(n):\n    # Write your code here\n    pass`,
        javascript: `function fib(n) {\n    // Write your code here\n}`,
        java: `class Solution {\n    public int fib(int n) {\n        // Write your code here\n        return 0;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    int fib(int n) {\n        // Write your code here\n        return 0;\n    }\n};`
      },
      testCases: [
        { input: "2", expectedOutput: "1", isHidden: false },
        { input: "3", expectedOutput: "2", isHidden: false },
        { input: "4", expectedOutput: "3", isHidden: false },
        { input: "0", expectedOutput: "0", isHidden: true },
        { input: "1", expectedOutput: "1", isHidden: true },
        { input: "10", expectedOutput: "55", isHidden: true },
        { input: "20", expectedOutput: "6765", isHidden: true },
        { input: "30", expectedOutput: "832040", isHidden: true }
      ]
    }
  ];

  for (const prob of problems) {
    const { testCases, ...problemData } = prob;
    
    // Create problem
    const createdProb = await prisma.problem.create({
      data: problemData
    });

    console.log(`Created problem: ${createdProb.title} (ID: ${createdProb.id})`);

    // Create test cases
    for (const tc of testCases) {
      await prisma.testCase.create({
        data: {
          problemId: createdProb.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden
        }
      });
    }
    console.log(`  - Inserted ${testCases.length} test cases`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
