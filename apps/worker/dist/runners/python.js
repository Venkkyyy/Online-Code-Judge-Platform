"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPython = runPython;
const dockerode_1 = __importDefault(require("dockerode"));
const docker = new dockerode_1.default();
async function runPython(submission) {
    const { code, problem } = submission;
    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
        return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
    }
    // To run python, we'll use the official python alpine image
    // We'll iterate through test cases and execute them.
    // In a real sandbox, we'd mount a directory with a test runner script.
    // For MVP, we will inject a small python script that runs the user code and verifies output.
    let maxTime = 0;
    for (const tc of testCases) {
        const wrappedCode = code;
        try {
            const startTime = Date.now();
            const container = await docker.createContainer({
                Image: 'python:3.11-alpine',
                Cmd: ['python', '-c', wrappedCode],
                OpenStdin: true,
                StdinOnce: true,
                User: '1000:1000',
                HostConfig: {
                    Memory: 256 * 1024 * 1024, // 256MB
                    MemorySwap: 256 * 1024 * 1024, // 256MB (No swap)
                    NetworkMode: 'none', // Network isolated
                    PidsLimit: 64,
                    CapDrop: ['ALL'],
                    SecurityOpt: ['no-new-privileges'],
                    ReadonlyRootfs: true,
                    Tmpfs: { '/work': 'size=64m,exec,mode=777' },
                },
                StopTimeout: 5,
            });
            const stream = await container.attach({ stream: true, stdin: true, stdout: true, stderr: true });
            await container.start();
            stream.end(tc.input);
            // Wait for completion or timeout
            const waitPromise = container.wait();
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 5000));
            const result = await Promise.race([waitPromise, timeoutPromise]);
            if (result === 'TIMEOUT') {
                await container.stop();
                await container.remove();
                return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: tc.id };
            }
            const execTime = Date.now() - startTime;
            maxTime = Math.max(maxTime, execTime);
            // Docker logs have multiplexing headers. For a quick MVP fix, we can just remove non-printable chars.
            const rawLogs = await container.logs({ stdout: true, stderr: true });
            const cleanLogs = rawLogs.toString('utf-8').replace(/[^\x20-\x7E\n]/g, '').trim();
            await container.remove();
            if (result.StatusCode !== 0) {
                return { status: 'RUNTIME_ERROR', failedCaseId: tc.id, errorMessage: cleanLogs };
            }
            if (normalizeOutput(cleanLogs) !== normalizeOutput(tc.expectedOutput)) {
                return { status: 'WRONG_ANSWER', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: 15360 };
            }
        }
        catch (err) {
            return { status: 'INTERNAL_ERROR', errorMessage: err.message };
        }
    }
    return { status: 'ACCEPTED', executionTime: maxTime, memoryUsed: 15360 };
}
function normalizeOutput(value) {
    return value.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trimEnd();
}
