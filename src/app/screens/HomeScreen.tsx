import { useEffect } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ProgressCircle } from "../components/ProgressCircle";

import { Badge } from "../components/ui/badge";
import { Flame, Zap, BookOpen, PlayCircle, Trophy, TrendingUp, AlertTriangle, User, Calendar, Target } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { AnimatedCounter } from "../components/AnimatedCounter";

interface HomeScreenProps {
  onNavigate: (screen: string, data?: { moduleId?: number; lessonId?: number }) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user } = useAuth();
  const { progress, modules, readinessScore, loadProgress, loadModules, loadReadiness } = useApp();

  useEffect(() => {
    loadProgress();
    loadModules();
    loadReadiness();
  }, [loadProgress, loadModules, loadReadiness]);

  const firstName = user?.fullName?.split(' ')[0] || 'Learner';
  const readiness = readinessScore ?? null;
  const streakCurrent = progress?.streakCurrent || user?.streakCurrent || 0;
  const xpTotal = progress?.xpTotal || user?.xpTotal || 0;

  // Days to test
  const daysToTest = user?.testDate ? Math.ceil((new Date(user.testDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  // Find first in-progress module
  const inProgressModule = progress?.modules?.find(m => m.status === 'in_progress') || progress?.modules?.[0];
  const inProgressModuleFull = modules.find(m => m.slug === inProgressModule?.moduleSlug);

  // Recent badges
  const recentBadge = progress?.badges?.[0];

  return (
    <div className="size-full overflow-auto bg-[#F0FDF4] pb-28">
      {/* Cosmic header with mesh blobs */}
      <div className="relative p-6 pb-10 rounded-b-[2.5rem] overflow-hidden"
        style={{ background: "linear-gradient(135deg, #15803D 0%, #22C55E 40%, #0A1F12 100%)" }}
      >
        {/* Animated mesh blobs */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#15803D]/30 blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-[#22C55E]/20 blur-[70px]"
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 relative z-10"
        >
          <p className="text-white/70 mb-1 font-medium">Welcome back,</p>
          <h1 className="text-white" style={{ fontSize: "1.875rem", fontWeight: 700, fontFamily: "Poppins" }}>
            {firstName}! 👋
          </h1>
        </motion.div>

        {/* Glass hero card — Readiness as North Star */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="relative z-10"
        >
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white/70 mb-2 font-medium">Readiness Score</p>
                <h2 className="text-white mb-2" style={{ fontSize: "1.25rem", fontWeight: 600, fontFamily: "Poppins" }}>
                  {readiness !== null ? `${readiness}% ready` : 'Take diagnostic to start'}
                </h2>
                <p className="text-white/80 text-sm">
                  {readiness === null
                    ? "We'll estimate your readiness after a quick diagnostic."
                    : readiness >= 65
                    ? "You're on track! Keep going."
                    : "Keep studying — you'll get there."}
                </p>
                {daysToTest !== null && daysToTest > 0 && (
                  <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {daysToTest} day{daysToTest !== 1 ? 's' : ''} to your test
                  </p>
                )}
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="glow-pulse rounded-full"
              >
                <ProgressCircle progress={readiness ?? 0} size={100} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="p-6 space-y-6 -mt-4 relative z-10">
        {/* Stat cards with animated counters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="perspective-card"
          >
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#22C55E]/20 to-[#4ADE80]/10">
                  <Flame className="w-5 h-5 text-[#22C55E]" />
                </div>
                <span className="text-sm text-[#4B7C5F] font-medium">Day Streak</span>
              </div>
              <AnimatedCounter
                value={streakCurrent}
                className="text-2xl font-bold text-[#14532D]"
                style={{ fontFamily: "Poppins" }}
              />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="perspective-card"
          >
            <div className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#15803D]/20 to-[#22C55E]/10">
                  <Zap className="w-5 h-5 text-[#15803D]" />
                </div>
                <span className="text-sm text-[#4B7C5F] font-medium">Total XP</span>
              </div>
              <AnimatedCounter
                value={xpTotal}
                className="text-2xl font-bold text-[#14532D]"
                style={{ fontFamily: "Poppins" }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Daily Session CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="perspective-card"
          >
            <Card className="p-5 cursor-pointer glass-card border-[#15803D]/10 hover:shadow-xl hover:shadow-[#15803D]/10 transition-all" onClick={() => onNavigate("modules")}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#15803D] to-[#22C55E]"
                >
                  <Target className="w-8 h-8 text-white" />
                </motion.div>
                <div className="flex-1">
                  <h4 className="mb-1 font-semibold text-[#14532D]">Today's Session</h4>
                  <p className="text-sm text-[#4B7C5F]">
                    {readiness !== null && readiness >= 65
                      ? "You're ready for a mock test!"
                      : "Continue your daily practice"}
                  </p>
                </div>
                <BookOpen className="w-5 h-5 text-[#15803D]" />
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Continue Learning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#14532D] font-bold">Continue Learning</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("modules")} className="text-[#15803D]">
              View All
            </Button>
          </div>

          {inProgressModule ? (
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="perspective-card"
            >
              <Card
                className="p-5 cursor-pointer glass-card border-[#15803D]/10 hover:shadow-xl hover:shadow-[#15803D]/10 transition-all"
                onClick={() => onNavigate("lesson", { moduleId: inProgressModuleFull?.id })}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-[#15803D]/20 to-[#22C55E]/10"
                  >
                    <BookOpen className="w-8 h-8 text-[#15803D]" />
                  </motion.div>
                  <div className="flex-1">
                    <Badge className="mb-2 bg-gradient-to-r from-[#15803D] to-[#22C55E] text-white font-medium border-0">
                      {inProgressModule.status === 'in_progress' ? 'In Progress' : 'Start'}
                    </Badge>
                    <h4 className="mb-1 font-semibold text-[#14532D]">{inProgressModule.moduleTitle}</h4>
                    <p className="text-sm text-[#4B7C5F] mb-3">
                      {inProgressModule.lessonsCompleted}/{inProgressModule.totalLessons} lessons completed
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2.5 bg-[#BBF7D0] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${inProgressModule.progressPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-[#15803D] to-[#22C55E] rounded-full"
                        />
                      </div>
                      <span className="text-sm font-semibold text-[#15803D]">{Math.round(inProgressModule.progressPercent)}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#4B7C5F]">
                      <span className="flex items-center gap-1">
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Zap className="w-4 h-4 text-[#22C55E]" />
                        </motion.div>
                        {inProgressModuleFull?.xpReward || 500} XP
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="perspective-card"
            >
              <Card className="p-5 cursor-pointer glass-card border-[#15803D]/10 hover:shadow-xl transition-all" onClick={() => onNavigate("modules")}>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#15803D]/20 to-[#22C55E]/10">
                    <BookOpen className="w-8 h-8 text-[#15803D]" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-[#14532D]">Get Started</h4>
                    <p className="text-sm text-[#4B7C5F]">Browse available modules</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions with glow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="mb-4 font-bold text-[#14532D]">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="perspective-card"
            >
              <Card className="p-4 cursor-pointer glass-card border-[#15803D]/10 hover:border-[#15803D]/30 hover:shadow-xl hover:shadow-[#15803D]/10 transition-all" onClick={() => onNavigate("mock-test")}>
                <div className="flex flex-col items-center text-center gap-3">
                  <motion.div
                    whileHover={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="p-3 rounded-xl bg-gradient-to-br from-[#15803D]/20 to-[#22C55E]/10"
                  >
                    <PlayCircle className="w-8 h-8 text-[#15803D]" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-[#14532D]">Mock Test</h4>
                    <p className="text-sm text-[#4B7C5F]">Practice exam</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="perspective-card"
            >
              <Card className="p-4 cursor-pointer glass-card border-[#15803D]/10 hover:border-[#15803D]/30 hover:shadow-xl hover:shadow-[#15803D]/10 transition-all" onClick={() => onNavigate("leaderboard")}>
                <div className="flex flex-col items-center text-center gap-3">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="p-3 rounded-xl bg-gradient-to-br from-[#15803D]/20 to-[#22C55E]/10"
                  >
                    <Trophy className="w-8 h-8 text-[#15803D]" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-[#14532D]">Leaderboard</h4>
                    <p className="text-sm text-[#4B7C5F]">See rankings</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Recent Achievements */}
        {recentBadge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="mb-4 text-[#14532D] font-bold">Recent Achievements</h3>
            <Card className="p-4 glass-card border-[#15803D]/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#15803D] to-[#22C55E]">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#14532D] font-semibold">{recentBadge.title}</h4>
                  <p className="text-sm text-[#4B7C5F]">{recentBadge.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#15803D] font-semibold">+{recentBadge.xpReward} XP</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
