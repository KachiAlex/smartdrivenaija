import express from 'express';
import cors from 'cors';
import authRoutes from '../server/src/routes/auth.js';
import adminRoutes from '../server/src/routes/admin.js';
import userRoutes from '../server/src/routes/user.js';
import modulesRoutes from '../server/src/routes/modules.js';
import progressRoutes from '../server/src/routes/progress.js';
import quizRoutes from '../server/src/routes/quiz.js';
import mockTestRoutes from '../server/src/routes/mockTest.js';
import leaderboardRoutes from '../server/src/routes/leaderboard.js';
import walletRoutes from '../server/src/routes/wallet.js';
import remindersRoutes from '../server/src/routes/reminders.js';
import hazardsRoutes from '../server/src/routes/hazards.js';
import rewardsRoutes from '../server/src/routes/rewards.js';
import referralsRoutes from '../server/src/routes/referrals.js';
import offencesRoutes from '../server/src/routes/offences.js';
import studyPlannerRoutes from '../server/src/routes/studyPlanner.js';
import aiCoachRoutes from '../server/src/routes/aiCoach.js';
import biometricRoutes from '../server/src/routes/biometric.js';
import drivingSchoolsRoutes from '../server/src/routes/drivingSchools.js';
import fleetRoutes from '../server/src/routes/fleet.js';
import parentGuardianRoutes from '../server/src/routes/parentGuardian.js';
import smartDriveFMRoutes from '../server/src/routes/smartDriveFM.js';
import frscAnalyticsRoutes from '../server/src/routes/frscAnalytics.js';
import nationalIntelligenceRoutes from '../server/src/routes/nationalIntelligence.js';
import renewalMarketplaceRoutes from '../server/src/routes/renewalMarketplace.js';
import routeIntelligenceRoutes from '../server/src/routes/routeIntelligence.js';
import insurancePortalRoutes from '../server/src/routes/insurancePortal.js';
import computerVisionRoutes from '../server/src/routes/computerVision.js';
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
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/modules', modulesRoutes);
app.use('/progress', progressRoutes);
app.use('/quiz', quizRoutes);
app.use('/mock-test', mockTestRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/wallet', walletRoutes);
app.use('/reminders', remindersRoutes);
app.use('/hazards', hazardsRoutes);
app.use('/rewards', rewardsRoutes);
app.use('/referrals', referralsRoutes);
app.use('/offences', offencesRoutes);
app.use('/study-planner', studyPlannerRoutes);
app.use('/ai-coach', aiCoachRoutes);
app.use('/biometric', biometricRoutes);
app.use('/driving-schools', drivingSchoolsRoutes);
app.use('/fleet', fleetRoutes);
app.use('/parent-guardian', parentGuardianRoutes);
app.use('/smartdrive-fm', smartDriveFMRoutes);
app.use('/frsc-analytics', frscAnalyticsRoutes);
app.use('/national-intelligence', nationalIntelligenceRoutes);
app.use('/renewal-marketplace', renewalMarketplaceRoutes);
app.use('/route-intelligence', routeIntelligenceRoutes);
app.use('/insurance-portal', insurancePortalRoutes);
app.use('/computer-vision', computerVisionRoutes);

// Error handling
app.use(errorHandler);

// Export for Vercel serverless function
export default (req, res) => {
  app(req, res);
};
