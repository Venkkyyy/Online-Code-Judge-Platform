"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionQueue = void 0;
exports.enqueueSubmission = enqueueSubmission;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const redisConnection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Required for BullMQ
});
exports.submissionQueue = new bullmq_1.Queue('submissions', {
    connection: redisConnection
});
async function enqueueSubmission(submissionId, mode = 'SUBMIT') {
    console.log(`[API] Enqueueing submission ${submissionId}`);
    try {
        const job = await exports.submissionQueue.add('execute', { submissionId, mode }, {
            jobId: submissionId,
            removeOnComplete: true,
            removeOnFail: 100
        });
        console.log(`[API] Enqueued successfully. Job ID: ${job.id}`);
    }
    catch (err) {
        console.error(`[API] Failed to enqueue:`, err);
        // Do not acknowledge a submission that has no path to a worker.
        // BullMQ's deterministic job id makes a client retry safe.
        throw err;
    }
}
