import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import prisma from './lib/db';
import dotenv from 'dotenv';
import { executeCode } from './runners';

dotenv.config();

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

async function processSubmission(job: Job) {
  const { submissionId } = job.data;
  const mode = job.data.mode === 'RUN' ? 'RUN' : 'SUBMIT';
  console.log(`[Worker] Processing submission: ${submissionId}`);

  // Fetch submission and related problem testcases
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: {
        include: { testCases: { where: mode === 'RUN' ? { isHidden: false } : {}, orderBy: { id: 'asc' } } }
      }
    }
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  // Update status to RUNNING
  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: 'RUNNING' }
  });

  try {
    const result = await executeCode(submission);
    
    // Update DB with results
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: result.status,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        failedCaseId: result.failedCaseId,
        errorMessage: result.errorMessage
      }
    });

    console.log(`[Worker] Submission ${submissionId} finished with status ${result.status}`);

  } catch (error: any) {
    console.error(`[Worker] Internal error for ${submissionId}:`, error);
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'INTERNAL_ERROR',
        errorMessage: error.message
      }
    });
  }
}

const worker = new Worker('submissions', processSubmission, {
  connection: redisConnection,
  concurrency: 5 // Process up to 5 submissions concurrently
});

worker.on('ready', () => {
  console.log('[Worker] Connected to Redis and ready to process jobs');
});

worker.on('error', (err) => {
  console.error('[Worker] Redis connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Worker] Shutting down...');
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
