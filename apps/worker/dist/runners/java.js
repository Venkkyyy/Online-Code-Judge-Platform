"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJava = runJava;
const dockerode_1 = __importDefault(require("dockerode"));
const stream_1 = require("stream");
const index_1 = require("./index");
const docker = new dockerode_1.default();
async function runJava(submission) {
    let { code, problem } = submission;
    const template = problem.templates?.java;
    code += (0, index_1.getDriverCode)(code, template, 'java');
    const testCases = problem.testCases || [];
    if (testCases.length === 0) {
        return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
    }
    let container = null;
    try {
        const testInputs = testCases.map((tc) => tc.input);
        const testExpected = testCases.map((tc) => tc.expectedOutput);
        const testIds = testCases.map((tc) => tc.id);
        const runScript = `
#!/bin/sh
set -e

# Compile
javac /work/Main.java -d /work 2>/work/compile_err.txt
COMPILE_EXIT=$?
if [ $COMPILE_EXIT -ne 0 ]; then
  ERR=$(cat /work/compile_err.txt | head -c 2000)
  printf '{"compile_error":true,"message":"%s"}' "$(echo "$ERR" | sed 's/"/\\\\"/g' | tr '\\n' ' ')"
  exit 0
fi

NUM_TESTS=$(cat /work/test_count.txt)
RESULTS="["
MAX_TIME=0
MAX_MEM=0

for i in $(seq 0 $((NUM_TESTS - 1))); do
  INPUT_FILE="/work/input_$i.txt"
  ID=$(sed -n "$((i+1))p" /work/test_ids.txt)

  START_MS=$(date +%s%3N 2>/dev/null || echo 0)
  time -v timeout 5 java -cp /work Main < "$INPUT_FILE" > /work/out.txt 2> /work/err_time.txt
  EXIT_CODE=$?
  END_MS=$(date +%s%3N 2>/dev/null || echo 0)

  MEM_KB=$(grep "Maximum resident set size" /work/err_time.txt | grep -o "[0-9]*" || echo 0)
  if [ "$MEM_KB" != "" ]; then
    MEM_BYTES=$((MEM_KB * 1024))
    [ $MEM_BYTES -gt $MAX_MEM ] && MAX_MEM=$MEM_BYTES
  fi

  awk '/^[[:space:]]*Command being timed:/{exit} {print}' /work/err_time.txt > /work/err.txt

  if [ "$START_MS" != "0" ] && [ "$END_MS" != "0" ]; then
    ELAPSED=$((END_MS - START_MS))
    [ $ELAPSED -gt $MAX_TIME ] && MAX_TIME=$ELAPSED
  fi

  if [ $EXIT_CODE -eq 124 ]; then
    [ "$i" -gt 0 ] && RESULTS="$RESULTS,"
    RESULTS="$RESULTS{\\\"status\\\":\\\"TIME_LIMIT_EXCEEDED\\\",\\\"id\\\":\\\"$ID\\\"}"
    break
  elif [ $EXIT_CODE -ne 0 ]; then
    ERR=$(cat /work/err.txt | head -c 500)
    [ "$i" -gt 0 ] && RESULTS="$RESULTS,"
    RESULTS="$RESULTS{\\\"status\\\":\\\"RUNTIME_ERROR\\\",\\\"id\\\":\\\"$ID\\\",\\\"error\\\":\\\"$ERR\\\"}"
    break
  else
    ACTUAL=$(cat /work/out.txt | tr -d '\\r' | awk '{$1=$1};1')
    EXPECTED=$(sed -n "$((i+1))p" /work/test_expected.txt | tr -d '\\r' | awk '{$1=$1};1')

    if [ "$ACTUAL" != "$EXPECTED" ]; then
      [ "$i" -gt 0 ] && RESULTS="$RESULTS,"
      RESULTS="$RESULTS{\\\"status\\\":\\\"WRONG_ANSWER\\\",\\\"id\\\":\\\"$ID\\\"}"
      break
    else
      [ "$i" -gt 0 ] && RESULTS="$RESULTS,"
      RESULTS="$RESULTS{\\\"status\\\":\\\"OK\\\"}"
    fi
  fi
done

RESULTS="$RESULTS]"
printf '{"results":%s,"maxTime":%d,"maxMem":%d}' "$RESULTS" "$MAX_TIME" "$MAX_MEM"
`.trim();
        const codeB64 = Buffer.from(code).toString('base64');
        const inputsB64 = Buffer.from(testInputs.join('\n')).toString('base64');
        const expectedB64 = Buffer.from(testExpected.join('\n')).toString('base64');
        const idsB64 = Buffer.from(testIds.join('\n')).toString('base64');
        const runScriptB64 = Buffer.from(runScript).toString('base64');
        const cmd = [
            'sh', '-c',
            `echo '${codeB64}' | base64 -d > /work/Main.java && ` +
                `echo '${inputsB64}' | base64 -d > /work/test_inputs_raw.txt && ` +
                `echo '${expectedB64}' | base64 -d > /work/test_expected.txt && ` +
                `echo '${idsB64}' | base64 -d > /work/test_ids.txt && ` +
                `echo '${testCases.length}' > /work/test_count.txt && ` +
                `echo '${runScriptB64}' | base64 -d > /work/run.sh && ` +
                `mkdir -p /work/inputs && ` +
                `awk '{print > "/work/input_"(NR-1)".txt"}' /work/test_inputs_raw.txt && ` +
                `timeout 45 sh /work/run.sh`
        ];
        container = await docker.createContainer({
            Image: 'eclipse-temurin:21-alpine',
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
        const stdout = new stream_1.Writable({
            write(chunk, encoding, callback) { stdoutChunks.push(Buffer.from(chunk)); callback(); }
        });
        const stderr = new stream_1.Writable({
            write(chunk, encoding, callback) { stderrChunks.push(Buffer.from(chunk)); callback(); }
        });
        const stream = await container.attach({ stream: true, stdout: true, stderr: true });
        docker.modem.demuxStream(stream, stdout, stderr);
        await container.start();
        const waitRes = await Promise.race([
            container.wait(),
            new Promise(r => setTimeout(() => r('TIMEOUT'), 45000))
        ]);
        if (waitRes === 'TIMEOUT') {
            await container.stop().catch(() => { });
            return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: testCases[0]?.id, executionTime: 0, memoryUsed: 0 };
        }
        const stdoutText = Buffer.concat(stdoutChunks).toString('utf-8').trim();
        const stderrText = Buffer.concat(stderrChunks).toString('utf-8').trim();
        try {
            if (stdoutText.startsWith('{')) {
                const outObj = JSON.parse(stdoutText);
                if (outObj.compile_error) {
                    return { status: 'COMPILATION_ERROR', errorMessage: outObj.message };
                }
                const results = outObj.results || [];
                for (const r of results) {
                    if (r.status === 'WRONG_ANSWER') {
                        return { status: 'WRONG_ANSWER', failedCaseId: r.id, executionTime: outObj.maxTime, memoryUsed: outObj.maxMem };
                    }
                    if (r.status === 'TIME_LIMIT_EXCEEDED') {
                        return { status: 'TIME_LIMIT_EXCEEDED', failedCaseId: r.id, executionTime: outObj.maxTime, memoryUsed: outObj.maxMem };
                    }
                    if (r.status === 'RUNTIME_ERROR') {
                        return { status: 'RUNTIME_ERROR', failedCaseId: r.id, errorMessage: r.error, executionTime: outObj.maxTime, memoryUsed: outObj.maxMem };
                    }
                }
                return { status: 'ACCEPTED', executionTime: outObj.maxTime, memoryUsed: outObj.maxMem };
            }
            if (waitRes.StatusCode !== 0) {
                return { status: 'RUNTIME_ERROR', errorMessage: stderrText, executionTime: 0, memoryUsed: 0 };
            }
            return { status: 'ACCEPTED', executionTime: 0, memoryUsed: 0 };
        }
        catch (e) {
            return { status: 'RUNTIME_ERROR', errorMessage: 'Failed to parse execution results', executionTime: 0, memoryUsed: 0 };
        }
    }
    catch (error) {
        console.error('Java runner error:', error);
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
