"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureImagePulled = ensureImagePulled;
exports.getDriverCode = getDriverCode;
exports.executeCode = executeCode;
const python_1 = require("./python");
const javascript_1 = require("./javascript");
const cpp_1 = require("./cpp");
const java_1 = require("./java");
const dockerode_1 = __importDefault(require("dockerode"));
const docker = new dockerode_1.default();
async function ensureDockerAvailable() {
    try {
        await docker.ping();
        return true;
    }
    catch {
        console.warn('[Worker] Docker daemon not found; execution is unavailable.');
        return false;
    }
}
async function ensureImagePulled(image) {
    try {
        const images = await docker.listImages();
        if (images.some(img => img.RepoTags?.includes(image)))
            return;
        console.log(`[Worker] Pulling image ${image}, this might take a minute...`);
        await new Promise((resolve, reject) => {
            docker.pull(image, (err, stream) => {
                if (err)
                    return reject(err);
                docker.modem.followProgress(stream, onFinished, onProgress);
                function onFinished(err, output) {
                    if (err)
                        return reject(err);
                    resolve(output);
                }
                function onProgress(event) { }
            });
        });
        console.log(`[Worker] Successfully pulled ${image}`);
    }
    catch (err) {
        console.error(`[Worker] Failed to pull image ${image}:`, err.message);
    }
}
function getDriverCode(code, template, language) {
    if (!template)
        return '';
    const marker = language === 'python'
        ? '# DO NOT EDIT BELOW THIS LINE'
        : '// DO NOT EDIT BELOW THIS LINE';
    if (code.includes(marker))
        return '';
    const parts = template.split(marker);
    return parts.length > 1 ? '\n' + marker + parts[1] : '';
}
async function executeCode(submission) {
    if (!(await ensureDockerAvailable())) {
        return { status: 'INTERNAL_ERROR', errorMessage: 'The execution service is unavailable. Please try again shortly.' };
    }
    const lang = submission.language;
    if (lang === 'python')
        return (0, python_1.runPython)(submission);
    if (lang === 'javascript')
        return (0, javascript_1.runJavascript)(submission);
    if (lang === 'cpp')
        return (0, cpp_1.runCpp)(submission);
    if (lang === 'java')
        return (0, java_1.runJava)(submission);
    return { status: 'COMPILATION_ERROR', errorMessage: `Language '${lang}' is not supported by this judge.` };
}
