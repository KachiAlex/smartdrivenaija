import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import modulesRoutes from './routes/modules.js';
import progressRoutes from './routes/progress.js';
import quizRoutes from './routes/quiz.js';
import mockTestRoutes from './routes/mockTest.js';
import leaderboardRoutes from './routes/leaderboard.js';
import walletRoutes from './routes/wallet.js';
import remindersRoutes from './routes/reminders.js';
import referralsRoutes from './routes/referrals.js';
import rewardsRoutes from './routes/rewards.js';
import offencesRoutes from './routes/offences.js';
import hazardsRoutes from './routes/hazards.js';
import aiCoachRoutes from './routes/aiCoach.js';
import studyPlannerRoutes from './routes/studyPlanner.js';
import smartDriveFMRoutes from './routes/smartDriveFM.js';
import drivingSchoolRoutes from './routes/drivingSchools.js';
import fleetRoutes from './routes/fleet.js';
import parentGuardianRoutes from './routes/parentGuardian.js';
import frscAnalyticsRoutes from './routes/frscAnalytics.js';
import nationalIntelligenceRoutes from './routes/nationalIntelligence.js';
import routeIntelligenceRoutes from './routes/routeIntelligence.js';
import insurancePortalRoutes from './routes/insurancePortal.js';
import renewalMarketplaceRoutes from './routes/renewalMarketplace.js';
import computerVisionRoutes from './routes/computerVision.js';
import biometricRoutes from './routes/biometric.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://smartdrivenaija.com'
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/modules', modulesRoutes);
app.use('/progress', progressRoutes);
app.use('/quiz', quizRoutes);
app.use('/mock-test', mockTestRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/wallet', walletRoutes);
app.use('/reminders', remindersRoutes);
app.use('/referrals', referralsRoutes);
app.use('/rewards', rewardsRoutes);
app.use('/offences', offencesRoutes);
app.use('/hazards', hazardsRoutes);
app.use('/ai-coach', aiCoachRoutes);
app.use('/study-planner', studyPlannerRoutes);
app.use('/smartdrive-fm', smartDriveFMRoutes);
app.use('/driving-schools', drivingSchoolRoutes);
app.use('/fleet', fleetRoutes);
app.use('/parent-guardian', parentGuardianRoutes);
app.use('/frsc-analytics', frscAnalyticsRoutes);
app.use('/national-intelligence', nationalIntelligenceRoutes);
app.use('/route-intelligence', routeIntelligenceRoutes);
app.use('/insurance', insurancePortalRoutes);
app.use('/renewal', renewalMarketplaceRoutes);
app.use('/computer-vision', computerVisionRoutes);
app.use('/biometric', biometricRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`SmartDrive Naija API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
