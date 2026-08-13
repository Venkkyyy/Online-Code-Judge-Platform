"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJava = runJava;
const dockerode_1 = __importDefault(require("dockerode"));
const index_1 = require("./index");
const stream_1 = require("stream");
const docker = new dockerode_1.default();
async function runJava(submission) {
    const { code, problem } = submission;
    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
        return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
    }
    await (0, index_1.ensureImagePulled)('eclipse-temurin:21-alpine');
    // Java: expect user writes a class named `Solution` or `Main` with a main method,
    // or a Solution class with a method that reads stdin. We support stdin/stdout style.
    // We wrap the code so we can name the file `Main.java`.
    let maxTime = 0;
    let maxMemory = 0;
    for (const tc of testCases) {
        let container = null;
        try {
            // Write user code as Main.java, compile, run with stdin
            const escapedCode = code.replace(/\\/g, '\\\\').replace(/'/g, "'\\''");
            const escapedInput = (tc.input || '').replace(/\\/g, '\\\\').replace(/'/g, "'\\''");
            const runCmd = [
                'sh', '-c',
                // 1. Write source
                `mkdir -p /work && printf '%s' '${escapedCode}' > /work/Main.java && ` +
                    // 2. Compile
                    `javac /work/Main.java -d /work 2>&1; ` +
                    `COMPILE_EXIT=$?; ` +
                    `if [ $COMPILE_EXIT -ne 0 ]; then echo "COMPILE_FAILED:$COMPILE_EXIT"; exit $COMPILE_EXIT; fi && ` +
                    // 3. Run with stdin and timeout
                    `printf '%s' '${escapedInput}' | timeout 5 java -cp /work Main`
            ];
            container = await docker.createContainer({
                Image: 'eclipse-temurin:21-alpine',
                Cmd: runCmd,
                HostConfig: {
                    Memory: 256 * 1024 * 1024,
                    MemorySwap: 256 * 1024 * 1024,
                    NetworkMode: 'none',
                    PidsLimit: 128,
                    CapDrop: ['ALL'],
                    SecurityOpt: ['no-new-privileges'],
                    Tmpfs: { '/work': 'size=128m,exec,mode=777' },
                },
                StopTimeout: 20,
            });
            const stdoutChunks = [];
            const stderrChunks = [];
            const stdoutStream = new stream_1.Writable({ write(c, _, cb) { stdoutChunks.push(Buffer.from(c)); cb(); } });
            const stderrStream = new stream_1.Writable({ write(c, _, cb) { stderrChunks.push(Buffer.from(c)); cb(); } });
            const stream = await container.attach({ stream: true, stdout: true, stderr: true });
            docker.modem.demuxStream(stream, stdoutStream, stderrStream);
            const startMs = Date.now();
            await container.start();
            const waitRes = await Promise.race([
                container.wait(),
                new Promise(r => setTimeout(() => r('TIMEOUT'), 22000))
            ]);
            const elapsedMs = Date.now() - startMs;
            if (waitRes === 'TIMEOUT') {
                await container.stop().catch(() => { });
                return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: maxMemory };
            }
            const stdoutText = Buffer.concat(stdoutChunks).toString('utf-8');
            const stderrText = Buffer.concat(stderrChunks).toString('utf-8').replace(/[^\x20-\x7E\n]/g, '').trim();
            // Check for compile failure
            if (stderrText.includes('COMPILE_FAILED:') || stderrText.includes('error:')) {
                const cleanErr = stderrText.replace('COMPILE_FAILED:', '').trim();
                return { status: 'COMPILATION_ERROR', errorMessage: cleanErr };
            }
            if (waitRes.StatusCode === 124) {
                return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: maxMemory };
            }
            if (waitRes.StatusCode !== 0) {
                return { status: 'RUNTIME_ERROR', failedCaseId: tc.id, errorMessage: stderrText, executionTime: maxTime, memoryUsed: maxMemory };
            }
            maxTime = Math.max(maxTime, elapsedMs);
            // Java heap used — approximate from RSS (no /usr/bin/time on alpine easily)
            maxMemory = Math.max(maxMemory, 64 * 1024 * 1024); // floor 64MB for JVM
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
            if (container)
                await container.remove({ force: true }).catch(() => { });
        }
    }
    return { status: 'ACCEPTED', executionTime: maxTime, memoryUsed: maxMemory };
}
