"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const db_1 = __importDefault(require("./lib/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const runners_1 = require("./runners");
dotenv_1.default.config();
const redisConnection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
async function processSubmission(job) {
    const { submissionId } = job.data;
    const mode = job.data.mode === 'RUN' ? 'RUN' : 'SUBMIT';
    console.log(`[Worker] Processing submission: ${submissionId}`);
    // Fetch submission and related problem testcases
    const submission = await db_1.default.submission.findUnique({
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
    await db_1.default.submission.update({
        where: { id: submissionId },
        data: { status: 'RUNNING' }
    });
    try {
        const result = await (0, runners_1.executeCode)(submission);
        // Update DB with results
        await db_1.default.submission.update({
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
    }
    catch (error) {
        console.error(`[Worker] Internal error for ${submissionId}:`, error);
        await db_1.default.submission.update({
            where: { id: submissionId },
            data: {
                status: 'INTERNAL_ERROR',
                errorMessage: error.message
            }
        });
    }
}
const worker = new bullmq_1.Worker('submissions', processSubmission, {
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
    await db_1.default.$disconnect();
    process.exit(0);
});
