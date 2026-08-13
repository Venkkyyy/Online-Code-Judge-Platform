"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCpp = runCpp;
const dockerode_1 = __importDefault(require("dockerode"));
const index_1 = require("./index");
const stream_1 = require("stream");
const docker = new dockerode_1.default();
async function runCpp(submission) {
    const { code, problem } = submission;
    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
        return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
    }
    await (0, index_1.ensureImagePulled)('gcc:12');
    // ── Step 1: Compile ─────────────────────────────────────────────────────────
    // Wrap user code with a harness that reads args from stdin and outputs JSON
    const wrappedCode = `
#include <bits/stdc++.h>
using namespace std;

// ==========================================
// USER CODE
// ==========================================
${code}
// ==========================================

int main() {
  // We run the solution and let it use stdin/stdout directly.
  // For LC-style problems, the user's main() or solution function is expected.
  // If user has a main(), it will be called. Otherwise we call solution().
  return 0;
}
`;
    // For C++ we use a simpler approach: compile user code as-is (they write main),
    // pipe stdin, compare stdout to expected output (trimmed string comparison).
    // This supports both competitive-style (stdin/stdout) problems.
    let compileContainer = null;
    try {
        // Create a compile container — compile the user's code
        compileContainer = await docker.createContainer({
            Image: 'gcc:12',
            Cmd: ['bash', '-c',
                `echo '${code.replace(/'/g, "'\\''")}' > /work/main.cpp && g++ -std=c++17 -O2 -o /work/main /work/main.cpp 2>&1; echo "EXIT:$?"`
            ],
            HostConfig: {
                Memory: 256 * 1024 * 1024,
                MemorySwap: 256 * 1024 * 1024,
                NetworkMode: 'none',
                PidsLimit: 64,
                CapDrop: ['ALL'],
                SecurityOpt: ['no-new-privileges'],
                Binds: [],
                Tmpfs: { '/work': 'size=64m,exec,mode=777' },
            },
            StopTimeout: 15,
        });
        const compileOut = [];
        const compileStream = new stream_1.Writable({ write(c, _, cb) { compileOut.push(Buffer.from(c)); cb(); } });
        const attachStream = await compileContainer.attach({ stream: true, stdout: true, stderr: true });
        docker.modem.demuxStream(attachStream, compileStream, compileStream);
        await compileContainer.start();
        const compileWait = await Promise.race([
            compileContainer.wait(),
            new Promise(r => setTimeout(() => r('TIMEOUT'), 15000))
        ]);
        if (compileWait === 'TIMEOUT') {
            await compileContainer.stop().catch(() => { });
            return { status: 'COMPILATION_ERROR', errorMessage: 'Compilation timed out (>15s).' };
        }
        const compileOutput = Buffer.concat(compileOut).toString('utf-8');
        const exitLine = compileOutput.split('\n').find(l => l.startsWith('EXIT:'));
        const exitCode = exitLine ? parseInt(exitLine.split(':')[1]) : 1;
        if (exitCode !== 0) {
            const errMsg = compileOutput.replace(/EXIT:\d+/, '').trim();
            return { status: 'COMPILATION_ERROR', errorMessage: errMsg };
        }
        await compileContainer.remove({ force: true }).catch(() => { });
        compileContainer = null;
    }
    catch (err) {
        if (compileContainer)
            await compileContainer.remove({ force: true }).catch(() => { });
        return { status: 'INTERNAL_ERROR', errorMessage: 'Compile stage failed: ' + err.message };
    }
    // ── Step 2: Run each test case ───────────────────────────────────────────────
    let maxTime = 0;
    let maxMemory = 0;
    for (const tc of testCases) {
        let runContainer = null;
        try {
            // Compile + run in one container so we have the binary
            const runCmd = [
                'bash', '-c',
                `printf '%s' '${(tc.input || '').replace(/'/g, "'\\''")}' > /work/input.txt && ` +
                    `echo '${code.replace(/'/g, "'\\''")}' > /work/main.cpp && ` +
                    `g++ -std=c++17 -O2 -o /work/main /work/main.cpp 2>/dev/null && ` +
                    `timeout 5 /work/main < /work/input.txt`
            ];
            runContainer = await docker.createContainer({
                Image: 'gcc:12',
                Cmd: runCmd,
                HostConfig: {
                    Memory: 256 * 1024 * 1024,
                    MemorySwap: 256 * 1024 * 1024,
                    NetworkMode: 'none',
                    PidsLimit: 64,
                    CapDrop: ['ALL'],
                    SecurityOpt: ['no-new-privileges'],
                    Tmpfs: { '/work': 'size=64m,exec,mode=777' },
                },
                StopTimeout: 6,
            });
            const stdoutChunks = [];
            const stderrChunks = [];
            const stdoutStream = new stream_1.Writable({ write(c, _, cb) { stdoutChunks.push(Buffer.from(c)); cb(); } });
            const stderrStream = new stream_1.Writable({ write(c, _, cb) { stderrChunks.push(Buffer.from(c)); cb(); } });
            const stream = await runContainer.attach({ stream: true, stdout: true, stderr: true });
            docker.modem.demuxStream(stream, stdoutStream, stderrStream);
            const startMs = Date.now();
            await runContainer.start();
            const waitRes = await Promise.race([
                runContainer.wait(),
                new Promise(r => setTimeout(() => r('TIMEOUT'), 7000))
            ]);
            const elapsedMs = Date.now() - startMs;
            if (waitRes === 'TIMEOUT') {
                await runContainer.stop().catch(() => { });
                return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: maxMemory };
            }
            const stdoutText = Buffer.concat(stdoutChunks).toString('utf-8');
            const stderrText = Buffer.concat(stderrChunks).toString('utf-8').replace(/[^\x20-\x7E\n]/g, '').trim();
            if (waitRes.StatusCode === 124) {
                return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: maxMemory };
            }
            if (waitRes.StatusCode !== 0) {
                return { status: 'RUNTIME_ERROR', failedCaseId: tc.id, errorMessage: stderrText, executionTime: maxTime, memoryUsed: maxMemory };
            }
            // Extract memory from /usr/bin/time output in stderr (if we ever re-add it)
            let memBytes = 0;
            const memMatch = stderrText.match(/"mem":(\d+)/);
            if (memMatch)
                memBytes = parseInt(memMatch[1]) * 1024; // KB → bytes
            maxTime = Math.max(maxTime, elapsedMs);
            maxMemory = Math.max(maxMemory, memBytes);
            // Compare output (trimmed)
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
            if (runContainer)
                await runContainer.remove({ force: true }).catch(() => { });
        }
    }
    return { status: 'ACCEPTED', executionTime: maxTime, memoryUsed: maxMemory };
}
