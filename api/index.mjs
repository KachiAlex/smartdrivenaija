import express from 'express';
import cors from 'cors';
import authRoutes from '../server/src/routes/auth.js';
import userRoutes from '../server/src/routes/user.js';
import modulesRoutes from '../server/src/routes/modules.js';
import progressRoutes from '../server/src/routes/progress.js';
import quizRoutes from '../server/src/routes/quiz.js';
import mockTestRoutes from '../server/src/routes/mockTest.js';
import leaderboardRoutes from '../server/src/routes/leaderboard.js';
import { errorHandler } from '../server/src/middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Strip /api prefix from requests (Vercel rewrites add it)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    req.url = req.url.slice(4); // Remove '/api' prefix
  }
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/modules', modulesRoutes);
app.use('/progress', progressRoutes);
app.use('/quiz', quizRoutes);
app.use('/mock-test', mockTestRoutes);
app.use('/leaderboard', leaderboardRoutes);

// Error handling
app.use(errorHandler);

// Export for Vercel serverless function
export default (req, res) => {
  app(req, res);
};
