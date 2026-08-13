"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJavascript = runJavascript;
const dockerode_1 = __importDefault(require("dockerode"));
const stream_1 = require("stream");
const docker = new dockerode_1.default();
async function runJavascript(submission) {
    const { code, problem } = submission;
    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
        return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
    }
    let maxTime = 0;
    let maxMemory = 0;
    for (const tc of testCases) {
        let container = null;
        try {
            const runCmd = [
                'sh', '-c',
                `printf '%s' '${(tc.input || '').replace(/'/g, "'\\''")}' > /work/input.txt && ` +
                    `echo '${code.replace(/'/g, "'\\''")}' > /work/main.js && ` +
                    `timeout 5 node /work/main.js < /work/input.txt`
            ];
            container = await docker.createContainer({
                Image: 'node:18-alpine',
                Cmd: runCmd,
                User: '1000:1000',
                HostConfig: {
                    Memory: 256 * 1024 * 1024,
                    MemorySwap: 256 * 1024 * 1024,
                    NetworkMode: 'none',
                    PidsLimit: 64,
                    CapDrop: ['ALL'],
                    SecurityOpt: ['no-new-privileges'],
                    Tmpfs: { '/work': 'size=64m,exec,mode=777' },
                },
                StopTimeout: 5,
            });
            const stdoutChunks = [];
            const stderrChunks = [];
            const stdout = new stream_1.Writable({ write(c, _, cb) { stdoutChunks.push(Buffer.from(c)); cb(); } });
            const stderr = new stream_1.Writable({ write(c, _, cb) { stderrChunks.push(Buffer.from(c)); cb(); } });
            const stream = await container.attach({ stream: true, stdout: true, stderr: true });
            docker.modem.demuxStream(stream, stdout, stderr);
            const startMs = Date.now();
            await container.start();
            const waitRes = await Promise.race([
                container.wait(),
                new Promise(r => setTimeout(() => r('TIMEOUT'), 6000))
            ]);
            const elapsedMs = Date.now() - startMs;
            if (waitRes === 'TIMEOUT') {
                await container.stop().catch(() => { });
                return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: maxMemory };
            }
            const stdoutText = Buffer.concat(stdoutChunks).toString('utf-8').trim();
            const stderrText = Buffer.concat(stderrChunks).toString('utf-8').replace(/[^\x20-\x7E\n]/g, '').trim();
            if (waitRes.StatusCode === 124) {
                return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: maxMemory };
            }
            if (waitRes.StatusCode !== 0) {
                return { status: 'RUNTIME_ERROR', failedCaseId: tc.id, errorMessage: stderrText, executionTime: maxTime, memoryUsed: maxMemory };
            }
            maxTime = Math.max(maxTime, elapsedMs);
            maxMemory = Math.max(maxMemory, 64 * 1024 * 1024); // Fallback estimate since no /usr/bin/time on alpine
            const actual = stdoutText.trim();
            const expected = (tc.expectedOutput || '').trim();
            if (actual !== expected) {
                return { status: 'WRONG_ANSWER', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: maxMemory };
            }
        }
        catch (err) {
            return { status: 'INTERNAL_ERROR', errorMessage: err.message };
        }
        finally {
            if (container)
                await container.remove({ force: true }).catch(() => { });
        }
    }
    return { status: 'ACCEPTED', executionTime: maxTime, memoryUsed: maxMemory };
}
