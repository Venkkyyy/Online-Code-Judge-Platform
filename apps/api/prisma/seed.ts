import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.problem.create({
    data: {
      title: 'Two Sum',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\n### Example 1:\n```\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].\n```',
      difficulty: 'Easy',
      tags: ['Array', 'Hash Table'],
      published: true,
      testCases: {
        create: [
          { input: '4\n2 7 11 15\n9\n', expectedOutput: '0 1\n', isHidden: false },
          { input: '3\n3 2 4\n6\n', expectedOutput: '1 2\n', isHidden: false },
          { input: '2\n3 3\n6\n', expectedOutput: '0 1\n', isHidden: false },
        ]
      }
    }
  })

  await prisma.problem.create({
    data: {
      title: 'Add Two Numbers',
      description: 'You are given two **non-empty** linked lists representing two non-negative integers. The digits are stored in **reverse order**, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\nYou may assume the two numbers do not contain any leading zero, except the number 0 itself.',
      difficulty: 'Medium',
      tags: ['Linked List', 'Math'],
      published: true,
      testCases: {
        create: [
          { input: 'l1 = [2,4,3]\nl2 = [5,6,4]', expectedOutput: '[7,0,8]', isHidden: false }
        ]
      }
    }
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
