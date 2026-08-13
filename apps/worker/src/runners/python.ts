import Docker from 'dockerode';
import { ExecutionResult } from './index';
import { Writable } from 'stream';

const docker = new Docker();

export async function runPython(submission: any): Promise<ExecutionResult> {
  const { code, problem } = submission;
  const testCases = problem.testCases || [];
  
  if (testCases.length === 0) {
    return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
  }

  let maxTime = 0;
  let maxMemory = 0;
  
  for (const tc of testCases) {
    const wrappedCode = `
import sys
import time
import resource
import json
import ast
import traceback
from typing import *

# ==========================================
# USER CODE
# ==========================================
${code}
# ==========================================

def __run_test():
    try:
        sol_class = globals().get("Solution")
        if not sol_class:
            print(json.dumps({"error": "Class 'Solution' not found"}), file=sys.stderr)
            sys.exit(1)
        
        sol = sol_class()
        methods = [m for m in dir(sol) if not m.startswith("__") and callable(getattr(sol, m))]
        if not methods:
            print(json.dumps({"error": "No method found in Solution"}), file=sys.stderr)
            sys.exit(1)
            
        method_name = methods[0]
        method = getattr(sol, method_name)
        
        input_data = sys.stdin.read().strip()
        args = []
        try:
            if input_data:
                for line in input_data.split('\\n'):
                    line = line.strip()
                    if not line:
                        continue
                    if '=' in line:
                        line = line.split('=', 1)[1].strip()
                    args.append(ast.literal_eval(line))
        except Exception as e:
            print(json.dumps({"error": f"Failed to parse testcase: {e}"}), file=sys.stderr)
            sys.exit(1)
            
        start_time = time.time()
        
        result = method(*args)
        
        end_time = time.time()
        
        # Memory in bytes (ru_maxrss is KB on Alpine Linux)
        ru_maxrss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        mem_bytes = ru_maxrss * 1024
        exec_ms = int((end_time - start_time) * 1000)
        
        print(json.dumps({
            "result": result,
            "time_ms": exec_ms,
            "memory_bytes": mem_bytes
        }))
        
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    __run_test()
`;

    let container: Docker.Container | null = null;
    try {
      container = await docker.createContainer({
        Image: 'python:3.11-alpine',
        Cmd: ['python', '-c', wrappedCode],
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
          ReadonlyRootfs: true,
          Tmpfs: { '/work': 'size=64m,exec,mode=777' },
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
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), 3000));
      
      const result: any = await Promise.race([waitPromise, timeoutPromise]);
      
      if (result === 'TIMEOUT') {
        await container.stop();
        return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: tc.id };
      }

      const stdoutText = Buffer.concat(stdoutChunks).toString('utf-8').trim();
      let stderrText = Buffer.concat(stderrChunks).toString('utf-8').trim();

      // Clean multiplexing headers for safe parsing
      stderrText = stderrText.replace(/[^\x20-\x7E\n]/g, '').trim();

      if (result.StatusCode !== 0) {
        // Strip out the harness tracebacks to only show user code tracebacks
        let cleanErr = stderrText;
        const lines = cleanErr.split('\\n');
        const userErrLines = lines.filter(l => !l.includes('__run_test') && !l.includes('sol_class =') && !l.includes('sys.exit'));
        return { status: 'RUNTIME_ERROR', failedCaseId: tc.id, errorMessage: userErrLines.join('\\n') };
      }

      let parsedOut: any;
      try {
        parsedOut = JSON.parse(stdoutText);
      } catch (e) {
        return { status: 'INTERNAL_ERROR', errorMessage: 'Failed to parse worker output: ' + stdoutText };
      }
      
      maxTime = Math.max(maxTime, parsedOut.time_ms);
      maxMemory = Math.max(maxMemory, parsedOut.memory_bytes);

      // Simple JSON stringify comparison
      let expectedParsed: any;
      try {
        expectedParsed = JSON.parse(tc.expectedOutput);
      } catch (e) {
        // If not JSON (e.g. just a raw unquoted string), fall back to string comparison
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
