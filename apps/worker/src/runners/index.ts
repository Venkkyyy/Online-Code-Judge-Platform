import { runPython } from './python';
import { runJavascript } from './javascript';
import { runCpp } from './cpp';
import { runJava } from './java';
import Docker from 'dockerode';

const docker = new Docker();

export type ExecutionResult = {
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' | 'INTERNAL_ERROR';
  executionTime?: number;
  memoryUsed?: number;
  failedCaseId?: number;
  errorMessage?: string;
};

async function ensureDockerAvailable() {
  try {
    await docker.ping();
    return true;
  } catch {
    console.warn('[Worker] Docker daemon not found; execution is unavailable.');
    return false;
  }
}

export async function executeCode(submission: any): Promise<ExecutionResult> {
  if (!(await ensureDockerAvailable())) {
    return { status: 'INTERNAL_ERROR', errorMessage: 'The execution service is unavailable. Please try again shortly.' };
  }

  const lang = submission.language;
  if (lang === 'python')     return runPython(submission);
  if (lang === 'javascript') return runJavascript(submission);
  if (lang === 'cpp')        return runCpp(submission);
  if (lang === 'java')       return runJava(submission);

  return { status: 'COMPILATION_ERROR' as const, errorMessage: `Language '${lang}' is not supported by this judge.` };
}
