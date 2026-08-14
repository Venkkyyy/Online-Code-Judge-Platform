import Docker from 'dockerode';
import { ExecutionResult, getDriverCode } from './index';
import { Writable } from 'stream';

const docker = new Docker();

export async function runJavascript(submission: any): Promise<ExecutionResult> {
  let { code, problem } = submission;
  const testCases = problem.testCases || [];

  if (testCases.length === 0) {
    return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
  }
  
  const template = problem.templates?.javascript || problem.templates?.js;
  code += getDriverCode(code, template, 'javascript');

  let container: Docker.Container | null = null;

  try {
    const testInputs = testCases.map((tc: any) => (tc.input || '').replace(/\\r/g, ''));
    const testExpected = testCases.map((tc: any) => (tc.expectedOutput || '').trim());
    const testIds = testCases.map((tc: any) => tc.id);

    // Node.js harness: spawns user code once per test case inside the same container
    const harnessScript = `
const { execFileSync } = require('child_process');
const fs = require('fs');

const inputs = JSON.parse(fs.readFileSync('/work/test_inputs.json', 'utf8'));
const expected = JSON.parse(fs.readFileSync('/work/test_expected.json', 'utf8'));
const ids = JSON.parse(fs.readFileSync('/work/test_ids.json', 'utf8'));
const code = fs.readFileSync('/work/main.js', 'utf8');

const results = [];
let maxTime = 0;
let maxMem = 0;

for (let i = 0; i < inputs.length; i++) {
  try {
    const start = performance.now();
    const proc = spawnSync('node', [
        '--no-warnings',
        '-e',
        \`\${code}\\nconst res = new Solution().${problem.methodName}(...JSON.parse(process.argv[1])); console.log(JSON.stringify({res, mem: process.memoryUsage().rss}));\`
        , inputs[i]
    ], { encoding: 'utf-8', timeout: 5000 });

    const elapsedMs = performance.now() - start;
    maxTime = Math.max(maxTime, elapsedMs);

    if (proc.status !== 0) {
        results.push({ status: "RUNTIME_ERROR", id: ids[i], error: proc.stderr?.slice(0, 2000) || proc.stdout?.slice(0, 2000) });
        break;
    }

    try {
        const out = JSON.parse(proc.stdout.trim());
        const actual = JSON.stringify(out.res);
        maxMem = Math.max(maxMem, out.mem);
        
        if (actual !== JSON.stringify(JSON.parse(expected[i]))) {
            results.push({ status: "WRONG_ANSWER", id: ids[i] });
            break;
        }
    } catch (err) {
        results.push({ status: "RUNTIME_ERROR", id: ids[i], error: "Failed to parse output" });
        break;
    }
    results.push({ status: 'OK' });
  } catch (err) {
    if (err.killed || (err.signal && err.signal === 'SIGTERM')) {
      results.push({ status: 'TIME_LIMIT_EXCEEDED', id: ids[i] });
    } else {
      results.push({ status: 'RUNTIME_ERROR', id: ids[i], error: err.message });
    }
    break;
  }
}

console.log(JSON.stringify({ results, maxTime, maxMem }));
`.trim();

    const codeB64 = Buffer.from(code).toString('base64');
    const harnessB64 = Buffer.from(harnessScript).toString('base64');
    const inputsB64 = Buffer.from(JSON.stringify(testInputs)).toString('base64');
    const expectedB64 = Buffer.from(JSON.stringify(testExpected)).toString('base64');
    const idsB64 = Buffer.from(JSON.stringify(testIds)).toString('base64');

    const cmd = [
      'sh', '-c',
      `echo '${codeB64}' | base64 -d > /work/main.js && ` +
      `echo '${harnessB64}' | base64 -d > /work/harness.js && ` +
      `echo '${inputsB64}' | base64 -d > /work/test_inputs.json && ` +
      `echo '${expectedB64}' | base64 -d > /work/test_expected.json && ` +
      `echo '${idsB64}' | base64 -d > /work/test_ids.json && ` +
      `timeout 30 node /work/harness.js`
    ];

    container = await docker.createContainer({
      Image: 'node:18-alpine',
      Cmd: cmd,
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
      StopTimeout: 32,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const stdout = new Writable({ write(c, _, cb) { stdoutChunks.push(Buffer.from(c)); cb(); } });
    const stderr = new Writable({ write(c, _, cb) { stderrChunks.push(Buffer.from(c)); cb(); } });

    const stream = await container.attach({ stream: true, stdout: true, stderr: true });
    docker.modem.demuxStream(stream, stdout, stderr);

    await container.start();

    const waitRes: any = await Promise.race([
      container.wait(),
      new Promise(r => setTimeout(() => r('TIMEOUT'), 35000))
    ]);

    if (waitRes === 'TIMEOUT') {
      await container.stop().catch(() => {});
      return { status: 'TIME_LIMIT_EXCEEDED', executionTime: 0, memoryUsed: 0 };
    }

    const stdoutText = Buffer.concat(stdoutChunks).toString('utf-8').trim();
    const stderrText = Buffer.concat(stderrChunks).toString('utf-8').replace(/[^\x20-\x7E\n]/g, '').trim();

    if (waitRes.StatusCode !== 0) {
      return { status: 'RUNTIME_ERROR', errorMessage: stderrText || 'Execution failed', executionTime: 0, memoryUsed: 0 };
    }

    try {
      const output = JSON.parse(stdoutText);
      const results: any[] = output.results;
      const maxTime = output.maxTime || 0;

      for (const r of results) {
        if (r.status === 'WRONG_ANSWER') return { status: 'WRONG_ANSWER', failedCaseId: r.id, executionTime: maxTime, memoryUsed: 0 };
        if (r.status === 'TIME_LIMIT_EXCEEDED') return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: r.id, executionTime: maxTime, memoryUsed: 0 };
        if (r.status === 'RUNTIME_ERROR') return { status: 'RUNTIME_ERROR', failedCaseId: r.id, errorMessage: r.error, executionTime: maxTime, memoryUsed: 0 };
      }
      return { status: 'ACCEPTED', executionTime: maxTime, memoryUsed: 0 };
    } catch {
      return { status: 'RUNTIME_ERROR', errorMessage: stderrText || stdoutText || 'Failed to parse results', executionTime: 0, memoryUsed: 0 };
    }
  } catch (err: any) {
    return { status: 'INTERNAL_ERROR', errorMessage: err.message };
  } finally {
    if (container) await container.remove({ force: true }).catch(() => {});
  }
}
