import Docker from 'dockerode';
import { ExecutionResult } from './index';
import { Writable } from 'stream';

const docker = new Docker();

export async function runJavascript(submission: any): Promise<ExecutionResult> {
  const { code, problem } = submission;
  const testCases = problem.testCases || [];

  if (testCases.length === 0) {
    return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
  }

  let maxTime = 0;
  let maxMemory = 0;

  for (const tc of testCases) {
    // Build a self-contained JS harness that reads from stdin and runs the user's solution
    const wrappedCode = `
const { performance } = require('perf_hooks');
const { execSync } = require('child_process');

// ==========================================
// USER CODE
// ==========================================
${code}
// ==========================================

function main() {
  try {
    // Find Solution class or solve function
    let result;
    const inputRaw = require('fs').readFileSync('/dev/stdin', 'utf-8').trim();
    
    // Try to parse the input - support multiple formats
    let args = [];
    if (inputRaw) {
      try {
        // Try JSON parse first
        const parsed = JSON.parse('[' + inputRaw + ']');
        args = parsed;
      } catch(e) {
        // Fall back to line-based parsing
        args = inputRaw.split('\\n').map(line => {
          try { return JSON.parse(line.trim()); } catch { return line.trim(); }
        });
      }
    }

    const startTime = performance.now();
    let memBefore = process.memoryUsage().heapUsed;

    if (typeof Solution !== 'undefined') {
      const sol = new Solution();
      const methods = Object.getOwnPropertyNames(Solution.prototype).filter(m => m !== 'constructor');
      if (!methods.length) throw new Error("No method found in Solution class");
      result = sol[methods[0]](...args);
    } else if (typeof solve !== 'undefined') {
      result = solve(...args);
    } else {
      throw new Error("No Solution class or 'solve' function found.");
    }

    const endTime = performance.now();
    const memAfter = process.memoryUsage().heapUsed;
    
    console.log(JSON.stringify({
      result,
      time_ms: Math.round(endTime - startTime),
      memory_bytes: Math.max(0, memAfter - memBefore) + process.memoryUsage().rss
    }));
  } catch(e) {
    process.stderr.write(JSON.stringify({ error: e.message + '\\n' + e.stack }));
    process.exit(1);
  }
}

main();
`;

    let container: Docker.Container | null = null;
    try {
      container = await docker.createContainer({
        Image: 'node:18-alpine',
        Cmd: ['node', '-e', wrappedCode],
        OpenStdin: true,
        StdinOnce: true,
        User: '1000:1000',
        HostConfig: {
          Memory: 256 * 1024 * 1024,
          MemorySwap: 256 * 1024 * 1024,
          NetworkMode: 'none',
          PidsLimit: 64,
          CapDrop: ['ALL'],
          SecurityOpt: ['no-new-privileges'],
        },
        StopTimeout: 5,
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];
      const stdout = new Writable({
        write(chunk, _encoding, callback) { stdoutChunks.push(Buffer.from(chunk)); callback(); },
      });
      const stderr = new Writable({
        write(chunk, _encoding, callback) { stderrChunks.push(Buffer.from(chunk)); callback(); },
      });

      const stream = await container.attach({ stream: true, stdin: true, stdout: true, stderr: true });
      docker.modem.demuxStream(stream, stdout, stderr);
      await container.start();
      stream.write(tc.input);
      stream.end();

      const waitPromise = container.wait();
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 5000));

      const result: any = await Promise.race([waitPromise, timeoutPromise]);

      if (result === 'TIMEOUT') {
        await container.stop();
        return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: tc.id };
      }

      const stdoutText = Buffer.concat(stdoutChunks).toString('utf-8').trim();
      let stderrText = Buffer.concat(stderrChunks).toString('utf-8').trim();
      stderrText = stderrText.replace(/[^\x20-\x7E\n]/g, '').trim();

      if (result.StatusCode !== 0) {
        let errMsg = stderrText;
        try {
          const parsed = JSON.parse(errMsg);
          errMsg = parsed.error || errMsg;
        } catch {}
        return { status: 'RUNTIME_ERROR', failedCaseId: tc.id, errorMessage: errMsg };
      }

      let parsedOut: any;
      try {
        parsedOut = JSON.parse(stdoutText);
      } catch (e) {
        return { status: 'INTERNAL_ERROR', errorMessage: 'Failed to parse worker output: ' + stdoutText };
      }

      maxTime = Math.max(maxTime, parsedOut.time_ms || 0);
      maxMemory = Math.max(maxMemory, parsedOut.memory_bytes || 0);

      let expectedParsed: any;
      try {
        expectedParsed = JSON.parse(tc.expectedOutput);
      } catch (e) {
        if (String(parsedOut.result).trim() !== String(tc.expectedOutput).trim()) {
          return { status: 'WRONG_ANSWER', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: maxMemory };
        }
        continue;
      }

      if (JSON.stringify(parsedOut.result) !== JSON.stringify(expectedParsed)) {
        return { status: 'WRONG_ANSWER', failedCaseId: tc.id, executionTime: maxTime, memoryUsed: maxMemory };
      }
    } catch (err: any) {
      return { status: 'INTERNAL_ERROR', errorMessage: err.message };
    } finally {
      if (container) {
        await container.remove({ force: true }).catch(() => undefined);
      }
    }
  }

  return { status: 'ACCEPTED', executionTime: maxTime, memoryUsed: maxMemory };
}
