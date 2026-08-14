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

export async function ensureImagePulled(image: string) {
  try {
    const images = await docker.listImages();
    if (images.some(img => img.RepoTags?.includes(image))) return;

    console.log(`[Worker] Pulling image ${image}, this might take a minute...`);
    await new Promise((resolve, reject) => {
      docker.pull(image, (err: any, stream: any) => {
        if (err) return reject(err);
        docker.modem.followProgress(stream, onFinished, onProgress);
        function onFinished(err: any, output: any) {
          if (err) return reject(err);
          resolve(output);
        }
        function onProgress(event: any) {}
      });
    });
    console.log(`[Worker] Successfully pulled ${image}`);
  } catch (err: any) {
    console.error(`[Worker] Failed to pull image ${image}:`, err.message);
  }
}

export function getDriverCode(code: string, template: string | undefined, language: string): string {
  if (!template) return '';
  const marker = language === 'python' 
    ? '# DO NOT EDIT BELOW THIS LINE' 
    : '// DO NOT EDIT BELOW THIS LINE';
  if (code.includes(marker)) return '';
  const parts = template.split(marker);
  return parts.length > 1 ? '\n' + marker + parts[1] : '';
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
