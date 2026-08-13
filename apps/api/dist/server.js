"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./lib/db"));
const firebase_1 = require("./lib/firebase");
const queue_1 = require("./lib/queue");
const auth_1 = require("./middleware/auth");
dotenv_1.default.config();
(0, firebase_1.initFirebaseAdmin)();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});
// ── WebRTC Signaling ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', socket.id);
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', socket.id);
        });
    });
    socket.on('offer', (payload) => {
        socket.to(payload.roomId).emit('offer', { senderId: socket.id, offer: payload.offer });
    });
    socket.on('answer', (payload) => {
        socket.to(payload.roomId).emit('answer', { senderId: socket.id, answer: payload.answer });
    });
    socket.on('ice-candidate', (payload) => {
        socket.to(payload.roomId).emit('ice-candidate', { senderId: socket.id, candidate: payload.candidate });
    });
    socket.on('code-update', (payload) => {
        if (!payload || !payload.roomId || typeof payload.code !== 'string')
            return;
        socket.to(payload.roomId).emit('code-update', { senderId: socket.id, code: payload.code });
    });
});
// Security Middlewares
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            frameAncestors: ["'none'"],
            connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com"]
        }
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '256kb' }));
// Routes
const router = express_1.default.Router();
async function createJudgement(req, res, mode) {
    try {
        const { problemId, language, code } = req.body;
        const parsedProblemId = Number(problemId);
        const allowedLanguages = ['python', 'javascript', 'cpp', 'java'];
        if (!Number.isInteger(parsedProblemId) || parsedProblemId < 1 || typeof code !== 'string' || code.trim().length === 0 || code.length > 256 * 1024 || !allowedLanguages.includes(language)) {
            return res.status(400).json({ error: 'Invalid submission payload' });
        }
        if (mode === 'SUBMIT' && !req.user.emailVerified && process.env.NODE_ENV === 'production') {
            return res.status(403).json({ error: 'Verify your email before submitting code' });
        }
        const problem = await db_1.default.problem.findFirst({ where: { id: parsedProblemId, published: true }, select: { id: true } });
        if (!problem)
            return res.status(404).json({ error: 'Problem not found' });
        await db_1.default.user.upsert({
            where: { id: req.user.uid },
            update: {},
            create: {
                id: req.user.uid,
                email: req.user.email || 'unknown@example.com',
                role: 'USER'
            }
        });
        const submission = await db_1.default.submission.create({
            data: {
                userId: req.user.uid,
                problemId: parsedProblemId,
                language,
                code,
                status: 'QUEUED'
            }
        });
        await (0, queue_1.enqueueSubmission)(submission.id, mode);
        res.status(201).json({ ...submission, mode });
    }
    catch (error) {
        console.error(`${mode === 'RUN' ? 'Run' : 'Submission'} failed:`, error);
        res.status(500).json({ error: `Failed to ${mode === 'RUN' ? 'run code' : 'create submission'}` });
    }
}
router.get('/problems', async (req, res) => {
    try {
        const problems = await db_1.default.problem.findMany({
            where: { published: true },
            orderBy: { id: 'asc' }
        });
        res.json(problems);
    }
    catch (error) {
        console.error('Failed to fetch problems:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/problems/:id', async (req, res) => {
    try {
        const problemId = Number(req.params.id);
        if (!Number.isInteger(problemId) || problemId < 1)
            return res.status(400).json({ error: 'Invalid problem id' });
        const problem = await db_1.default.problem.findUnique({
            where: { id: problemId },
            include: { testCases: { where: { isHidden: false }, select: { id: true, input: true, expectedOutput: true }, orderBy: { id: 'asc' } } }
        });
        if (!problem || !problem.published)
            return res.status(404).json({ error: 'Problem not found' });
        res.json(problem);
    }
    catch (error) {
        console.error('Failed to fetch problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/auth/sync', auth_1.authMiddleware, async (req, res) => {
    try {
        const decodedToken = req.user;
        // Upsert user in Postgres
        const user = await db_1.default.user.upsert({
            where: { id: decodedToken.uid },
            update: {
                email: decodedToken.email || '',
            },
            create: {
                id: decodedToken.uid,
                email: decodedToken.email || '',
                role: 'USER'
            }
        });
        res.json(user);
    }
    catch (error) {
        console.error('Auth sync failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ── Submissions ─────────────────────────────────────────────────────────────
router.post('/runs', auth_1.authMiddleware, (req, res) => createJudgement(req, res, 'RUN'));
router.post('/submissions', auth_1.authMiddleware, (req, res) => createJudgement(req, res, 'SUBMIT'));
router.get('/submissions/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const submission = await db_1.default.submission.findUnique({
            where: { id: req.params.id }
        });
        if (!submission)
            return res.status(404).json({ error: 'Not found' });
        if (submission.userId !== req.user.uid)
            return res.status(404).json({ error: 'Not found' });
        let beatsRuntime = 0;
        let beatsMemory = 0;
        if (submission.status === 'ACCEPTED') {
            const totalAccepted = await db_1.default.submission.count({
                where: { problemId: submission.problemId, status: 'ACCEPTED' }
            });
            if (totalAccepted > 1) {
                const slowerCount = await db_1.default.submission.count({
                    where: {
                        problemId: submission.problemId,
                        status: 'ACCEPTED',
                        executionTime: { gt: submission.executionTime || 0 }
                    }
                });
                const heavierCount = await db_1.default.submission.count({
                    where: {
                        problemId: submission.problemId,
                        status: 'ACCEPTED',
                        memoryUsed: { gt: submission.memoryUsed || 0 }
                    }
                });
                beatsRuntime = (slowerCount / totalAccepted) * 100;
                beatsMemory = (heavierCount / totalAccepted) * 100;
            }
            else {
                beatsRuntime = 100;
                beatsMemory = 100;
            }
        }
        res.json({
            ...submission,
            beatsRuntime: beatsRuntime.toFixed(1),
            beatsMemory: beatsMemory.toFixed(1)
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch submission' });
    }
});
// ── Admin ───────────────────────────────────────────────────────────────────
router.post('/admin/problems', auth_1.authMiddleware, async (req, res) => {
    try {
        // Verify admin/setter role
        const user = await db_1.default.user.findUnique({ where: { id: req.user.uid } });
        // In local dev, allow anyone to create problems to bypass the locked role UI.
        const isDev = process.env.NODE_ENV !== 'production';
        if (!isDev && (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER'))) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { title, difficulty, description, tags, testCases, published, templates } = req.body;
        const problem = await db_1.default.problem.create({
            data: {
                title,
                difficulty,
                description,
                tags,
                published: published ?? false,
                templates: templates ?? {},
                testCases: {
                    create: testCases // Array of { input, expectedOutput, isHidden }
                }
            }
        });
        res.status(201).json(problem);
    }
    catch (error) {
        console.error('Failed to create problem:', error);
        res.status(500).json({ error: 'Failed to create problem' });
    }
});
router.put('/admin/problems/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await db_1.default.user.findUnique({ where: { id: req.user.uid } });
        const isDev = process.env.NODE_ENV !== 'production';
        if (!isDev && (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER'))) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const { title, difficulty, description, tags, testCases, published, templates } = req.body;
        const problemId = parseInt(req.params.id);
        // Delete existing test cases safely
        await db_1.default.testCase.deleteMany({
            where: { problemId }
        });
        // Update problem and create new test cases
        const problem = await db_1.default.problem.update({
            where: { id: problemId },
            data: {
                title,
                difficulty,
                description,
                tags,
                published: published ?? false,
                templates: templates ?? {},
                testCases: {
                    create: testCases
                }
            }
        });
        res.json(problem);
    }
    catch (error) {
        console.error('Failed to update problem:', error);
        res.status(500).json({ error: 'Failed to update problem' });
    }
});
router.get('/admin/stats', async (req, res) => {
    try {
        const totalSubmissions = await db_1.default.submission.count();
        const activeUsers = await db_1.default.user.count();
        // Calculate average execution time using aggregations
        const aggregations = await db_1.default.submission.aggregate({
            _avg: {
                executionTime: true,
            },
        });
        const avgExecutionTime = aggregations._avg.executionTime || 0;
        const pendingDrafts = await db_1.default.problem.count({
            where: { published: false }
        });
        res.json({
            totalSubmissions,
            activeUsers,
            avgExecutionTime: Math.round(avgExecutionTime),
            pendingDrafts
        });
    }
    catch (error) {
        console.error('Failed to fetch admin stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/admin/problems', async (req, res) => {
    try {
        const problems = await db_1.default.problem.findMany({
            orderBy: { id: 'desc' },
            include: { testCases: true }
        });
        res.json(problems);
    }
    catch (error) {
        console.error('Failed to fetch admin problems:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ── Users ───────────────────────────────────────────────────────────────────
router.get('/users/profile', auth_1.authMiddleware, async (req, res) => {
    try {
        const totalSubmissions = await db_1.default.submission.count({
            where: { userId: req.user.uid }
        });
        const acceptedSubmissions = await db_1.default.submission.count({
            where: { userId: req.user.uid, status: 'ACCEPTED' }
        });
        const uniqueProblemsSolvedResult = await db_1.default.submission.findMany({
            where: { userId: req.user.uid, status: 'ACCEPTED' },
            distinct: ['problemId'],
            select: {
                problemId: true,
                problem: { select: { difficulty: true } }
            }
        });
        const problemsSolved = uniqueProblemsSolvedResult.length;
        const acceptanceRate = totalSubmissions > 0 ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) : 0;
        const difficultyBreakdown = {
            Easy: uniqueProblemsSolvedResult.filter(s => s.problem.difficulty.toLowerCase() === 'easy').length,
            Medium: uniqueProblemsSolvedResult.filter(s => s.problem.difficulty.toLowerCase() === 'medium').length,
            Hard: uniqueProblemsSolvedResult.filter(s => s.problem.difficulty.toLowerCase() === 'hard').length
        };
        // Total published problems by difficulty
        const totalByDifficulty = {
            Easy: await db_1.default.problem.count({ where: { difficulty: { equals: 'Easy', mode: 'insensitive' }, published: true } }),
            Medium: await db_1.default.problem.count({ where: { difficulty: { equals: 'Medium', mode: 'insensitive' }, published: true } }),
            Hard: await db_1.default.problem.count({ where: { difficulty: { equals: 'Hard', mode: 'insensitive' }, published: true } })
        };
        res.json({
            problemsSolved,
            totalSubmissions,
            acceptanceRate,
            difficultyBreakdown,
            totalByDifficulty,
            rank: Math.max(1, 100000 - problemsSolved * 100) // Dummy formula for rank
        });
    }
    catch (error) {
        console.error('Failed to fetch user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/users/submissions', auth_1.authMiddleware, async (req, res) => {
    try {
        const submissions = await db_1.default.submission.findMany({
            where: { userId: req.user.uid },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                problem: {
                    select: { title: true }
                }
            }
        });
        res.json(submissions);
    }
    catch (error) {
        console.error('Failed to fetch user submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// ── Collab Sessions ──────────────────────────────────────────────────────────
const generatePassword = () => Math.random().toString(36).slice(-6).toUpperCase();
router.post('/collab/create', auth_1.authMiddleware, async (req, res) => {
    try {
        const { problemId } = req.body;
        if (!problemId)
            return res.status(400).json({ error: 'problemId is required' });
        const password = generatePassword();
        const session = await db_1.default.collabSession.create({
            data: {
                problemId: Number(problemId),
                password,
                hostId: req.user.uid
            }
        });
        res.status(201).json({ sessionId: session.id, password });
    }
    catch (error) {
        console.error('Failed to create collab session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/collab/join', auth_1.authMiddleware, async (req, res) => {
    try {
        const { sessionId, password } = req.body;
        if (!sessionId || !password)
            return res.status(400).json({ error: 'sessionId and password required' });
        const session = await db_1.default.collabSession.findUnique({ where: { id: sessionId } });
        if (!session)
            return res.status(404).json({ error: 'Session not found' });
        if (session.password !== password)
            return res.status(403).json({ error: 'Invalid password' });
        await db_1.default.collabSession.update({
            where: { id: sessionId },
            data: {
                guest: {
                    connect: { id: req.user.uid }
                }
            }
        });
        res.json({ success: true, problemId: session.problemId });
    }
    catch (error) {
        console.error('Failed to join collab session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.use('/api/v1', router);
app.get('/health/live', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/health/ready', async (_req, res) => {
    try {
        await db_1.default.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'ready' });
    }
    catch {
        res.status(503).json({ status: 'not_ready' });
    }
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`API Server running on port ${PORT} with WebRTC Signaling`);
});
