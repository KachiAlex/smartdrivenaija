const express = require('express');
const cors = require('cors');
const authRoutes = require('../server/src/routes/auth');
const userRoutes = require('../server/src/routes/user');
const modulesRoutes = require('../server/src/routes/modules');
const progressRoutes = require('../server/src/routes/progress');
const quizRoutes = require('../server/src/routes/quiz');
const mockTestRoutes = require('../server/src/routes/mockTest');
const leaderboardRoutes = require('../server/src/routes/leaderboard');
const errorHandler = require('../server/src/middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

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

// Export for Vercel
module.exports = app;
