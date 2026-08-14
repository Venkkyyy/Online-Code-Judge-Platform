"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCpp = runCpp;
const dockerode_1 = __importDefault(require("dockerode"));
const stream_1 = require("stream");
const index_1 = require("./index");
const docker = new dockerode_1.default();
async function runCpp(submission) {
    let { code, problem } = submission;
    const template = problem.templates?.cpp;
    code += (0, index_1.getDriverCode)(code, template, 'cpp');
    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
        return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
    }
    let container = null;
    try {
        const testInputs = testCases.map((tc) => tc.input);
        const testExpected = testCases.map((tc) => tc.expectedOutput);
        const testIds = testCases.map((tc) => tc.id);
        const harnessScript = `
import subprocess, json, sys, os, time, resource

# Compile
comp = subprocess.run(['g++', '-std=c++17', '-O2', '-o', '/work/main', '/work/main.cpp'], capture_output=True, text=True)
if comp.returncode != 0:
    print(json.dumps({"compile_error": comp.stderr[:2000]}))
    sys.exit(0)

test_inputs = json.loads(open('/work/test_inputs.json').read())
test_ids = json.loads(open('/work/test_ids.json').read())
test_expected = json.loads(open('/work/test_expected.json').read())

results = []
max_time = 0
max_mem = 0

for i, (inp, expected, tid) in enumerate(zip(test_inputs, test_expected, test_ids)):
    try:
        start = time.monotonic()
        proc = subprocess.run(
            ['/work/main'],
            input=inp, capture_output=True, text=True, timeout=5
        )
        elapsed_ms = (time.monotonic() - start) * 1000
        max_time = max(max_time, elapsed_ms)
        try:
            mem_kb = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
            max_mem = max(max_mem, mem_kb * 1024)
        except: pass

        if proc.returncode != 0:
            results.append({"status": "RUNTIME_ERROR", "id": tid, "error": proc.stderr[:2000]})
            break

        actual = proc.stdout.strip()
        if actual != expected:
            results.append({"status": "WRONG_ANSWER", "id": tid})
            break

        results.append({"status": "OK"})
    except subprocess.TimeoutExpired:
        results.append({"status": "TIME_LIMIT_EXCEEDED", "id": tid})
        break
    except Exception as e:
        results.append({"status": "RUNTIME_ERROR", "id": tid, "error": str(e)[:2000]})
        break

print(json.dumps({"results": results, "maxTime": max_time, "maxMem": max_mem}))
`.trim();
        const codeB64 = Buffer.from(code).toString('base64');
        const harnessB64 = Buffer.from(harnessScript).toString('base64');
        const inputsB64 = Buffer.from(JSON.stringify(testInputs)).toString('base64');
        const expectedB64 = Buffer.from(JSON.stringify(testExpected)).toString('base64');
        const idsB64 = Buffer.from(JSON.stringify(testIds)).toString('base64');
        const cmd = [
            'sh', '-c',
            `echo '${codeB64}' | base64 -d > /work/main.cpp && ` +
                `echo '${harnessB64}' | base64 -d > /work/harness.py && ` +
                `echo '${inputsB64}' | base64 -d > /work/test_inputs.json && ` +
                `echo '${expectedB64}' | base64 -d > /work/test_expected.json && ` +
                `echo '${idsB64}' | base64 -d > /work/test_ids.json && ` +
                `timeout 30 python3 /work/harness.py`
        ];
        container = await docker.createContainer({
            Image: 'gcc:12',
            Cmd: cmd,
            User: '1000:1000',
            HostConfig: {
                Memory: 512 * 1024 * 1024,
                MemorySwap: 512 * 1024 * 1024,
                NetworkMode: 'none',
                PidsLimit: 64,
                CapDrop: ['ALL'],
                SecurityOpt: ['no-new-privileges'],
                Tmpfs: { '/work': 'size=64m,exec,mode=777' },
            },
            StopTimeout: 32,
        });
        const stdoutChunks = [];
        const stderrChunks = [];
        const stdoutStream = new stream_1.Writable({ write(c, _, cb) { stdoutChunks.push(Buffer.from(c)); cb(); } });
        const stderrStream = new stream_1.Writable({ write(c, _, cb) { stderrChunks.push(Buffer.from(c)); cb(); } });
        const stream = await container.attach({ stream: true, stdout: true, stderr: true });
        docker.modem.demuxStream(stream, stdoutStream, stderrStream);
        await container.start();
        const waitRes = await Promise.race([
            container.wait(),
            new Promise(r => setTimeout(() => r('TIMEOUT'), 35000))
        ]);
        if (waitRes === 'TIMEOUT') {
            await container.stop().catch(() => { });
            return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: testCases[0]?.id, executionTime: 0, memoryUsed: 0 };
        }
        const stdoutText = Buffer.concat(stdoutChunks).toString('utf-8').trim();
        const stderrText = Buffer.concat(stderrChunks).toString('utf-8').replace(/[^\x20-\x7E\n]/g, '').trim();
        try {
            const output = JSON.parse(stdoutText);
            if (output.compile_error) {
                return { status: 'COMPILATION_ERROR', errorMessage: output.compile_error };
            }
            const results = output.results;
            const maxTime = output.maxTime || 0;
            const maxMem = output.maxMem || 0;
            for (const r of results) {
                if (r.status === 'WRONG_ANSWER') {
                    return { status: 'WRONG_ANSWER', failedCaseId: r.id, executionTime: maxTime, memoryUsed: maxMem };
                }
                if (r.status === 'TIME_LIMIT_EXCEEDED') {
                    return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: r.id, executionTime: maxTime, memoryUsed: maxMem };
                }
                if (r.status === 'RUNTIME_ERROR') {
                    return { status: 'RUNTIME_ERROR', failedCaseId: r.id, errorMessage: r.error, executionTime: maxTime, memoryUsed: maxMem };
                }
            }
            return { status: 'ACCEPTED', executionTime: maxTime, memoryUsed: maxMem };
        }
        catch (err) {
            if (stderrText && (stderrText.includes('error:') || stderrText.includes('Error'))) {
                return { status: 'COMPILATION_ERROR', errorMessage: stderrText.slice(0, 2000) };
            }
            return { status: 'RUNTIME_ERROR', errorMessage: stderrText || stdoutText || 'Failed to parse results', executionTime: 0, memoryUsed: 0 };
        }
    }
    catch (error) {
        console.error('C++ runner error:', error);
        return { status: 'RUNTIME_ERROR', errorMessage: error.message || 'Execution failed' };
    }
    finally {
        if (container) {
            try {
                await container.remove({ force: true });
            }
            catch (e) { }
        }
    }
}
