import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required for BullMQ
});

export const submissionQueue = new Queue('submissions', {
  connection: redisConnection
});

export async function enqueueSubmission(submissionId: string, mode: 'RUN' | 'SUBMIT' = 'SUBMIT') {
  console.log(`[API] Enqueueing submission ${submissionId}`);
  try {
    const job = await submissionQueue.add('execute', { submissionId, mode }, {
      jobId: submissionId,
      removeOnComplete: true,
      removeOnFail: 100
    });
    console.log(`[API] Enqueued successfully. Job ID: ${job.id}`);
  } catch (err) {
    console.error(`[API] Failed to enqueue:`, err);
    // Do not acknowledge a submission that has no path to a worker.
    // BullMQ's deterministic job id makes a client retry safe.
    throw err;
  }
}
