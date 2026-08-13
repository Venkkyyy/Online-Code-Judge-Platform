import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const problems = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    description: `Given an array of integers <strong>nums</strong> and an integer <strong>target</strong>, return <em>indices of the two numbers such that they add up to target</em>.<br><br>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.<br><br><strong>Example:</strong><br><pre>Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]</pre>`,
    templates: {
      python: `from typing import List\nimport sys\n\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass\n\n# DO NOT EDIT BELOW THIS LINE\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: sys.exit(0)\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    target = int(lines[n+1])\n    res = Solution().twoSum(nums, target)\n    print(" ".join(map(str, res)))`,
      javascript: `class Solution {\n    twoSum(nums, target) {\n        \n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length > 0 && input[0] !== '') {\n    const n = parseInt(input[0]);\n    const nums = input.slice(1, n+1).map(Number);\n    const target = parseInt(input[n+1]);\n    const res = new Solution().twoSum(nums, target);\n    console.log(res.join(' '));\n}`,
      cpp: `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};\n\n// DO NOT EDIT BELOW THIS LINE\nint main() {\n    int n; if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for(int i=0; i<n; ++i) cin >> nums[i];\n    int target; cin >> target;\n    Solution obj;\n    vector<int> res = obj.twoSum(nums, target);\n    for(size_t i=0; i<res.size(); ++i) {\n        cout << res[i] << (i==res.size()-1 ? "" : " ");\n    }\n    cout << endl;\n    return 0;\n}`,
      java: `import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return null;\n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0; i<n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        Solution obj = new Solution();\n        int[] res = obj.twoSum(nums, target);\n        if (res != null) {\n            for(int i=0; i<res.length; i++) {\n                System.out.print(res[i] + (i==res.length-1 ? "" : " "));\n            }\n        }\n        System.out.println();\n    }\n}`
    },
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: false },
      { input: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true }
    ]
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['String', 'Stack'],
    description: `Given a string <strong>s</strong> containing just the characters <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code> and <code>']'</code>, determine if the input string is valid.<br><br><strong>Example:</strong><br><pre>Input: s = "()[]{}"\nOutput: true</pre>`,
    templates: {
      python: `import sys\n\nclass Solution:\n    def isValid(self, s: str) -> bool:\n        pass\n\n# DO NOT EDIT BELOW THIS LINE\nif __name__ == '__main__':\n    s = sys.stdin.read().strip()\n    res = Solution().isValid(s)\n    print("true" if res else "false")`,
      javascript: `class Solution {\n    isValid(s) {\n        \n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\nconst fs = require('fs');\nconst s = fs.readFileSync('/dev/stdin', 'utf-8').trim();\nconsole.log(new Solution().isValid(s) ? "true" : "false");`,
      cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};\n\n// DO NOT EDIT BELOW THIS LINE\nint main() {\n    string s; if (!(cin >> s)) return 0;\n    Solution obj;\n    bool res = obj.isValid(s);\n    cout << (res ? "true" : "false") << endl;\n    return 0;\n}`,
      java: `import java.util.*;\n\nclass Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        Solution obj = new Solution();\n        boolean res = obj.isValid(s);\n        System.out.println(res ? "true" : "false");\n    }\n}`
    },
    testCases: [
      { input: '()[]{}', expectedOutput: 'true', isHidden: false },
      { input: '(]', expectedOutput: 'false', isHidden: false },
      { input: '{[]}', expectedOutput: 'true', isHidden: true }
    ]
  },
  {
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming'],
    description: `Given an integer array <strong>nums</strong>, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.<br><br><strong>Example:</strong><br><pre>Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6</pre>`,
    templates: {
      python: `from typing import List\nimport sys\n\nclass Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        pass\n\n# DO NOT EDIT BELOW THIS LINE\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: sys.exit(0)\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    print(Solution().maxSubArray(nums))`,
      javascript: `class Solution {\n    maxSubArray(nums) {\n        \n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length > 0 && input[0] !== '') {\n    const n = parseInt(input[0]);\n    const nums = input.slice(1, n+1).map(Number);\n    console.log(new Solution().maxSubArray(nums));\n}`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};\n\n// DO NOT EDIT BELOW THIS LINE\nint main() {\n    int n; if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for(int i=0; i<n; ++i) cin >> nums[i];\n    Solution obj;\n    cout << obj.maxSubArray(nums) << endl;\n    return 0;\n}`,
      java: `import java.util.*;\n\nclass Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0; i<n; i++) nums[i] = sc.nextInt();\n        Solution obj = new Solution();\n        System.out.println(obj.maxSubArray(nums));\n    }\n}`
    },
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
      { input: '1\n1', expectedOutput: '1', isHidden: false },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23', isHidden: true }
    ]
  },
  {
    title: 'Container With Most Water',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers'],
    description: `You are given an integer array <strong>height</strong> of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container, such that the container contains the most water.<br><br><strong>Example:</strong><br><pre>Input: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49</pre>`,
    templates: {
      python: `from typing import List\nimport sys\n\nclass Solution:\n    def maxArea(self, height: List[int]) -> int:\n        pass\n\n# DO NOT EDIT BELOW THIS LINE\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: sys.exit(0)\n    n = int(lines[0])\n    height = [int(x) for x in lines[1:n+1]]\n    print(Solution().maxArea(height))`,
      javascript: `class Solution {\n    maxArea(height) {\n        \n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length > 0 && input[0] !== '') {\n    const n = parseInt(input[0]);\n    const h = input.slice(1, n+1).map(Number);\n    console.log(new Solution().maxArea(h));\n}`,
      cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};\n\n// DO NOT EDIT BELOW THIS LINE\nint main() {\n    int n; if (!(cin >> n)) return 0;\n    vector<int> h(n);\n    for(int i=0; i<n; ++i) cin >> h[i];\n    Solution obj;\n    cout << obj.maxArea(h) << endl;\n    return 0;\n}`,
      java: `import java.util.*;\n\nclass Solution {\n    public int maxArea(int[] height) {\n        return 0;\n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] h = new int[n];\n        for(int i=0; i<n; i++) h[i] = sc.nextInt();\n        Solution obj = new Solution();\n        System.out.println(obj.maxArea(h));\n    }\n}`
    },
    testCases: [
      { input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49', isHidden: false },
      { input: '2\n1 1', expectedOutput: '1', isHidden: false },
      { input: '3\n4 3 2', expectedOutput: '4', isHidden: true }
    ]
  },
  {
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    tags: ['Dynamic Programming'],
    description: `You are climbing a staircase. It takes <strong>n</strong> steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?<br><br><strong>Example:</strong><br><pre>Input: n = 3\nOutput: 3</pre>`,
    templates: {
      python: `import sys\n\nclass Solution:\n    def climbStairs(self, n: int) -> int:\n        pass\n\n# DO NOT EDIT BELOW THIS LINE\nif __name__ == '__main__':\n    val = sys.stdin.read().strip()\n    if val:\n        print(Solution().climbStairs(int(val)))`,
      javascript: `class Solution {\n    climbStairs(n) {\n        \n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim();\nif (input) console.log(new Solution().climbStairs(parseInt(input)));`,
      cpp: `#include <iostream>\nusing namespace std;\n\nclass Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};\n\n// DO NOT EDIT BELOW THIS LINE\nint main() {\n    int n; if (!(cin >> n)) return 0;\n    Solution obj;\n    cout << obj.climbStairs(n) << endl;\n    return 0;\n}`,
      java: `import java.util.*;\n\nclass Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}\n\n// DO NOT EDIT BELOW THIS LINE\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        Solution obj = new Solution();\n        System.out.println(obj.climbStairs(n));\n    }\n}`
    },
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false },
      { input: '3', expectedOutput: '3', isHidden: false },
      { input: '5', expectedOutput: '8', isHidden: true }
    ]
  }
];

async function main() {
  console.log('Seeding database with pristine LeetCode-style wrappers...');
  
  await prisma.$executeRaw`TRUNCATE TABLE "Problem" RESTART IDENTITY CASCADE`;
  
  for (const prob of problems) {
    const created = await prisma.problem.create({
      data: {
        title: prob.title,
        difficulty: prob.difficulty,
        tags: prob.tags,
        description: prob.description,
        published: true,
        templates: prob.templates,
        testCases: {
          create: prob.testCases
        }
      }
    });
    console.log(`Created problem: ${created.title}`);
  }
  
  console.log('Database successfully seeded with 5 core problems!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
