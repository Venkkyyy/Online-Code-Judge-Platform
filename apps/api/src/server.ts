import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import prisma from './lib/db';
import { initFirebaseAdmin, auth } from './lib/firebase';
import { enqueueSubmission } from './lib/queue';
import { authMiddleware } from './middleware/auth';

dotenv.config();
initFirebaseAdmin();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : (origin, callback) => callback(null, true),
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

  socket.on('code-update', (payload: any) => {
    if (!payload || !payload.roomId || typeof payload.code !== 'string') return;
    socket.to(payload.roomId).emit('code-update', { senderId: socket.id, code: payload.code });
  });
});

// Security Middlewares
app.use(helmet({
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

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : (origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(express.json({ limit: '256kb' }));

// Routes
const router = express.Router();

async function createJudgement(req: any, res: express.Response, mode: 'RUN' | 'SUBMIT') {
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
    const problem = await prisma.problem.findFirst({ where: { id: parsedProblemId, published: true }, select: { id: true } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    await prisma.user.upsert({
      where: { id: req.user.uid },
      update: { email: req.user.email || `unknown-${req.user.uid}@example.com` },
      create: {
        id: req.user.uid,
        email: req.user.email || `unknown-${req.user.uid}@example.com`,
        role: 'USER'
      }
    });

    const submission = await prisma.submission.create({
      data: {
        userId: req.user.uid,
        problemId: parsedProblemId,
        language,
        code,
        status: 'QUEUED',
        isRun: mode === 'RUN'
      }
    });

    await enqueueSubmission(submission.id, mode);

    res.status(201).json({ ...submission, mode });
  } catch (error) {
    console.error(`${mode === 'RUN' ? 'Run' : 'Submission'} failed:`, error);
    res.status(500).json({ error: `Failed to ${mode === 'RUN' ? 'run code' : 'create submission'}` });
  }
}

router.get('/problems', async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      where: { published: true },
      orderBy: { id: 'asc' },
      include: {
        _count: { select: { submissions: { where: { isRun: false } } } }
      }
    });
    // Compute acceptance rate for each problem
    const problemsWithRate = await Promise.all(problems.map(async (p: any) => {
      const total = p._count.submissions;
      const accepted = total > 0
        ? await prisma.submission.count({ where: { problemId: p.id, status: 'ACCEPTED', isRun: false } })
        : 0;
      const { _count, ...rest } = p;
      return { ...rest, totalSubmissions: total, acceptedSubmissions: accepted, acceptance: total > 0 ? parseFloat(((accepted / total) * 100).toFixed(1)) : 0 };
    }));
    res.json(problemsWithRate);
  } catch (error) {
    console.error('Failed to fetch problems:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/problems/:id', async (req, res) => {
  try {
    const problemId = Number(req.params.id);
    if (!Number.isInteger(problemId) || problemId < 1) return res.status(400).json({ error: 'Invalid problem id' });
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: { where: { isHidden: false }, select: { id: true, input: true, expectedOutput: true }, orderBy: { id: 'asc' } } }
    });
    if (!problem || !problem.published) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem);
  } catch (error) {
    console.error('Failed to fetch problem:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/sync', authMiddleware, async (req: any, res) => {
  try {
    const decodedToken = req.user;
    
    // Upsert user in Postgres
    const user = await prisma.user.upsert({
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
  } catch (error) {
    console.error('Auth sync failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Submissions ─────────────────────────────────────────────────────────────

router.post('/runs', authMiddleware, (req: any, res) => createJudgement(req, res, 'RUN'));

router.post('/submissions', authMiddleware, (req: any, res) => createJudgement(req, res, 'SUBMIT'));

router.get('/submissions/:id', authMiddleware, async (req: any, res) => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id }
    });
    if (!submission) return res.status(404).json({ error: 'Not found' });
    if (submission.userId !== req.user.uid) return res.status(404).json({ error: 'Not found' });
    
    let beatsRuntime = 0;
    let beatsMemory = 0;
    let runtimeDistribution: any[] = [];
    let memoryDistribution: any[] = [];
    
    function generateMockDistribution(userValue: number, unit: string) {
      const dist = [];
      const min = Math.max(1, userValue * 0.2);
      const max = userValue * 2.5;
      const step = (max - min) / 40;
      const peak = min + (max - min) * 0.4;
      const variance = (max - min) / 5;

      for (let i = 0; i < 40; i++) {
        const val = min + i * step;
        const height = Math.exp(-Math.pow(val - peak, 2) / (2 * Math.pow(variance, 2)));
        const count = Math.floor(height * 100 * (0.8 + Math.random() * 0.4));
        dist.push({
          mark: val.toFixed(0) + unit,
          count: Math.max(1, count)
        });
      }
      return dist;
    }
    
    if (submission.status === 'ACCEPTED') {
      const totalAccepted = await prisma.submission.count({
        where: { problemId: submission.problemId, status: 'ACCEPTED' }
      });
      if (totalAccepted > 1) {
        const slowerCount = await prisma.submission.count({
          where: { 
            problemId: submission.problemId, 
            status: 'ACCEPTED',
            executionTime: { gt: submission.executionTime || 0 }
          }
        });
        const heavierCount = await prisma.submission.count({
          where: { 
            problemId: submission.problemId, 
            status: 'ACCEPTED',
            memoryUsed: { gt: submission.memoryUsed || 0 }
          }
        });
        beatsRuntime = (slowerCount / totalAccepted) * 100;
        beatsMemory = (heavierCount / totalAccepted) * 100;
      } else {
        beatsRuntime = 100;
        beatsMemory = 100;
      }
      runtimeDistribution = generateMockDistribution(submission.executionTime || 50, 'ms');
      memoryDistribution = generateMockDistribution(submission.memoryUsed || 20, 'MB');
    }
    
    res.json({
      ...submission,
      beatsRuntime: beatsRuntime.toFixed(1),
      beatsMemory: beatsMemory.toFixed(1),
      runtimeDistribution,
      memoryDistribution
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// ── Admin ───────────────────────────────────────────────────────────────────

router.post('/admin/problems', authMiddleware, async (req: any, res) => {
  try {
    // Verify admin/setter role
    const user = await prisma.user.findUnique({ where: { id: req.user.uid } });
    // In local dev, allow anyone to create problems to bypass the locked role UI.
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, difficulty, description, tags, testCases, published, templates } = req.body;

    const problem = await prisma.problem.create({
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
  } catch (error) {
    console.error('Failed to create problem:', error);
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

router.put('/admin/problems/:id', authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.uid } });
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, difficulty, description, tags, testCases, published, templates } = req.body;
    const problemId = parseInt(req.params.id);

    // Delete existing test cases safely
    await prisma.testCase.deleteMany({
      where: { problemId }
    });

    // Update problem and create new test cases
    const problem = await prisma.problem.update({
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
  } catch (error) {
    console.error('Failed to update problem:', error);
    res.status(500).json({ error: 'Failed to update problem' });
  }
});

router.get('/admin/stats', async (req, res) => {
  try {
    const totalSubmissions = await prisma.submission.count();
    const activeUsers = await prisma.user.count();
    
    // Calculate average execution time using aggregations
    const aggregations = await prisma.submission.aggregate({
      _avg: {
        executionTime: true,
      },
    });
    const avgExecutionTime = aggregations._avg.executionTime || 0;

    const pendingDrafts = await prisma.problem.count({
      where: { published: false }
    });

    res.json({
      totalSubmissions,
      activeUsers,
      avgExecutionTime: Math.round(avgExecutionTime),
      pendingDrafts
    });
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/recent-submissions', authMiddleware, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.uid } });
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && (!user || (user.role !== 'ADMIN' && user.role !== 'PROBLEM_SETTER'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const submissions = await prisma.submission.findMany({
      where: { isRun: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        problem: { select: { title: true } },
        user: { select: { email: true } }
      }
    });
    
    res.json(submissions);
  } catch (error) {
    console.error('Failed to fetch recent submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/problems', async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { id: 'desc' },
      include: { testCases: true }
    });
    res.json(problems);
  } catch (error) {
    console.error('Failed to fetch admin problems:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Users ───────────────────────────────────────────────────────────────────

router.get('/users/profile', authMiddleware, async (req: any, res) => {
  try {
    const totalSubmissions = await prisma.submission.count({
      where: { userId: req.user.uid, isRun: false }
    });
    const acceptedSubmissions = await prisma.submission.count({
      where: { userId: req.user.uid, status: 'ACCEPTED', isRun: false }
    });

    const uniqueProblemsSolvedResult = await prisma.submission.findMany({
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
      Easy: uniqueProblemsSolvedResult.filter((s: any) => s.problem.difficulty.toLowerCase() === 'easy').length,
      Medium: uniqueProblemsSolvedResult.filter((s: any) => s.problem.difficulty.toLowerCase() === 'medium').length,
      Hard: uniqueProblemsSolvedResult.filter((s: any) => s.problem.difficulty.toLowerCase() === 'hard').length
    };
    
    // Total published problems by difficulty
    const totalByDifficulty = {
      Easy: await prisma.problem.count({ where: { difficulty: { equals: 'Easy', mode: 'insensitive' }, published: true } }),
      Medium: await prisma.problem.count({ where: { difficulty: { equals: 'Medium', mode: 'insensitive' }, published: true } }),
      Hard: await prisma.problem.count({ where: { difficulty: { equals: 'Hard', mode: 'insensitive' }, published: true } })
    };

    res.json({
      problemsSolved,
      totalSubmissions,
      acceptanceRate,
      difficultyBreakdown,
      totalByDifficulty,
      rank: Math.max(1, 100000 - problemsSolved * 100) // Dummy formula for rank
    });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  router.get('/users/submissions', authMiddleware, async (req: any, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user.uid, isRun: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        problem: {
          select: { title: true }
        }
      }
    });
    res.json(submissions);
  } catch (error) {
    console.error('Failed to fetch user submissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activity heatmap — count of submissions per day for last 365 days
router.get('/users/activity', authMiddleware, async (req: any, res) => {
  try {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);

    const subs = await prisma.submission.findMany({
      where: { userId: req.user.uid, isRun: false, createdAt: { gte: since } },
      select: { createdAt: true }
    });

    // Aggregate by date string (YYYY-MM-DD)
    const counts: Record<string, number> = {};
    for (const s of subs) {
      const dateKey = s.createdAt.toISOString().slice(0, 10);
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    }

    res.json(counts);
  } catch (error) {
    console.error('Failed to fetch user activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ── Collab Sessions ──────────────────────────────────────────────────────────

const generatePassword = () => Math.random().toString(36).slice(-6).toUpperCase();

router.post('/collab/create', authMiddleware, async (req: any, res) => {
  try {
    const { problemId } = req.body;
    if (!problemId) return res.status(400).json({ error: 'problemId is required' });

    const password = generatePassword();
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const session = await prisma.collabSession.create({
      data: {
        id: sessionId,
        problemId: Number(problemId),
        password,
        hostId: req.user.uid
      }
    });
    res.status(201).json({ sessionId: session.id, password });
  } catch (error) {
    console.error('Failed to create collab session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/collab/join', authMiddleware, async (req: any, res) => {
  try {
    const { sessionId, password } = req.body;
    if (!sessionId || !password) return res.status(400).json({ error: 'sessionId and password required' });

    const session = await prisma.collabSession.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.password !== password) return res.status(403).json({ error: 'Invalid password' });

    await prisma.collabSession.update({
      where: { id: sessionId },
      data: {
        guest: {
          connect: { id: req.user.uid }
        }
      }
    });

    res.json({ success: true, problemId: session.problemId });
  } catch (error) {
    console.error('Failed to join collab session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/api/v1', router);

app.get('/health/live', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not_ready' });
  }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server running on port ${PORT} with WebRTC Signaling`);
});
