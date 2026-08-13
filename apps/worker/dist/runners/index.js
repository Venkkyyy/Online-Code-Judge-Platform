"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCode = executeCode;
const python_1 = require("./python");
const dockerode_1 = __importDefault(require("dockerode"));
const docker = new dockerode_1.default();
// Check if Docker is available
let isDockerAvailable = false;
docker.ping().then(() => {
    isDockerAvailable = true;
    console.log('[Worker] Docker daemon connected.');
}).catch(() => {
    console.warn('[Worker] Docker daemon not found; execution is unavailable.');
});
async function executeCode(submission) {
    if (!isDockerAvailable) {
        return { status: 'INTERNAL_ERROR', errorMessage: 'The execution service is unavailable. Please try again shortly.' };
    }
    const lang = submission.language;
    if (lang === 'python')
        return (0, python_1.runPython)(submission);
    return { status: 'COMPILATION_ERROR', errorMessage: `Language ${lang} is not enabled by this judge.` };
}
// ── Mock Execution Fallback for Local Dev without Docker ──────────────────────
