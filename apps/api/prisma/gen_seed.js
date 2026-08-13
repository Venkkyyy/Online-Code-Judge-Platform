const fs = require('fs');

const problems = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    description: `Given an array of integers <strong>nums</strong> and an integer <strong>target</strong>, return <em>indices of the two numbers such that they add up to target</em>.<br><br>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.<br><br><strong>Example:</strong><br><pre>Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]</pre>`,
    methodName: 'twoSum',
    cppRet: 'vector<int>',
    cppArgs: 'vector<int>& nums, int target',
    javaRet: 'int[]',
    javaArgs: 'int[] nums, int target',
    pyArgs: 'nums: List[int], target: int',
    jsArgs: 'nums, target',
    cParse: `
    int n; if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for(int i=0; i<n; ++i) cin >> nums[i];
    int target; cin >> target;
    Solution obj;
    vector<int> res = obj.twoSum(nums, target);
    for(int i=0; i<res.size(); ++i) {
        cout << res[i] << (i==res.size()-1 ? "" : " ");
    }
    cout << endl;`,
    jParse: `
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for(int i=0; i<n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        Solution obj = new Solution();
        int[] res = obj.twoSum(nums, target);
        for(int i=0; i<res.length; i++) {
            System.out.print(res[i] + (i==res.length-1 ? "" : " "));
        }
        System.out.println();`,
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
    methodName: 'isValid',
    cppRet: 'bool', cppArgs: 'string s',
    javaRet: 'boolean', javaArgs: 'String s',
    pyArgs: 's: str', jsArgs: 's',
    cParse: `
    string s; if (!(cin >> s)) return 0;
    Solution obj;
    bool res = obj.isValid(s);
    cout << (res ? "true" : "false") << endl;`,
    jParse: `
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        Solution obj = new Solution();
        boolean res = obj.isValid(s);
        System.out.println(res ? "true" : "false");`,
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
    methodName: 'maxSubArray',
    cppRet: 'int', cppArgs: 'vector<int>& nums',
    javaRet: 'int', javaArgs: 'int[] nums',
    pyArgs: 'nums: List[int]', jsArgs: 'nums',
    cParse: `
    int n; if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for(int i=0; i<n; ++i) cin >> nums[i];
    Solution obj;
    cout << obj.maxSubArray(nums) << endl;`,
    jParse: `
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for(int i=0; i<n; i++) nums[i] = sc.nextInt();
        Solution obj = new Solution();
        System.out.println(obj.maxSubArray(nums));`,
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
    methodName: 'maxArea',
    cppRet: 'int', cppArgs: 'vector<int>& height',
    javaRet: 'int', javaArgs: 'int[] height',
    pyArgs: 'height: List[int]', jsArgs: 'height',
    cParse: `
    int n; if (!(cin >> n)) return 0;
    vector<int> h(n);
    for(int i=0; i<n; ++i) cin >> h[i];
    Solution obj;
    cout << obj.maxArea(h) << endl;`,
    jParse: `
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] h = new int[n];
        for(int i=0; i<n; i++) h[i] = sc.nextInt();
        Solution obj = new Solution();
        System.out.println(obj.maxArea(h));`,
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
    methodName: 'climbStairs',
    cppRet: 'int', cppArgs: 'int n',
    javaRet: 'int', javaArgs: 'int n',
    pyArgs: 'n: int', jsArgs: 'n',
    cParse: `
    int n; if (!(cin >> n)) return 0;
    Solution obj;
    cout << obj.climbStairs(n) << endl;`,
    jParse: `
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        Solution obj = new Solution();
        System.out.println(obj.climbStairs(n));`,
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false },
      { input: '3', expectedOutput: '3', isHidden: false },
      { input: '5', expectedOutput: '8', isHidden: true }
    ]
  }
];

const fullSeed = \`import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const problems = [\n\` + problems.map(p => {
  return \`  {
    title: \` + JSON.stringify(p.title) + \`,
    difficulty: \` + JSON.stringify(p.difficulty) + \`,
    tags: \` + JSON.stringify(p.tags) + \`,
    description: \` + JSON.stringify(p.description) + \`,
    templates: {
      python: \` + JSON.stringify(\`class Solution:
    def \${p.methodName}(self, \${p.pyArgs}):
        pass\`) + \`,
      javascript: \` + JSON.stringify(\`class Solution {
    \${p.methodName}(\${p.jsArgs}) {
        
    }
}\`) + \`,
      cpp: \` + JSON.stringify(\`#include <iostream>
#include <vector>
#include <string>
using namespace std;

class Solution {
public:
    \${p.cppRet} \${p.methodName}(\${p.cppArgs}) {
        
    }
};

// DO NOT EDIT BELOW THIS LINE
int main() {\${p.cParse}
    return 0;
}\`) + \`,
      java: \` + JSON.stringify(\`import java.util.*;

class Solution {
    public \${p.javaRet} \${p.methodName}(\${p.javaArgs}) {
        return \` + (p.javaRet === 'int' ? '0;' : p.javaRet === 'boolean' ? 'false;' : 'null;') + \`
    }
}

// DO NOT EDIT BELOW THIS LINE
public class Main {
    public static void main(String[] args) {\${p.jParse}
    }
}\`) + \`
    },
    testCases: \` + JSON.stringify(p.testCases) + \`
  }\`;
}).join(',\n') + \`\n];

async function main() {
  console.log('Seeding database with LeetCode-style problems...');
  
  await prisma.$executeRaw\\\`TRUNCATE TABLE "Problem" RESTART IDENTITY CASCADE\\\`;
  
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
    console.log(\`Created problem: \${created.title}\`);
  }
  
  console.log('Database successfully seeded!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
\`;

fs.writeFileSync('c:/Users/vinik/OneDrive/Desktop/Online Code Judge Platform/apps/api/prisma/seed.ts', fullSeed);
