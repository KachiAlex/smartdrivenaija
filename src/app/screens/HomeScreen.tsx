import { useEffect } from "react";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ProgressCircle } from "../components/ProgressCircle";
import { StatCard } from "../components/StatCard";
import { Badge } from "../components/ui/badge";
import { Flame, Zap, BookOpen, PlayCircle, Trophy, TrendingUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

interface HomeScreenProps {
  onNavigate: (screen: string, data?: { moduleId?: number; lessonId?: number }) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user } = useAuth();
  const { progress, modules, loadProgress, loadModules } = useApp();

  useEffect(() => {
    loadProgress();
    loadModules();
  }, [loadProgress, loadModules]);

  const firstName = user?.fullName?.split(' ')[0] || 'Learner';
  const overallPercent = progress?.overallPercent || 0;
  const streakCurrent = progress?.streakCurrent || user?.streakCurrent || 0;
  const xpTotal = progress?.xpTotal || user?.xpTotal || 0;

  // Find first in-progress module
  const inProgressModule = progress?.modules?.find(m => m.status === 'in_progress') || progress?.modules?.[0];
  const inProgressModuleFull = modules.find(m => m.slug === inProgressModule?.moduleSlug);

  // Recent badges
  const recentBadge = progress?.badges?.[0];

  return (
    <div className="size-full overflow-auto bg-background pb-24">
      <div className="bg-gradient-to-br from-primary via-emerald-600 to-secondary text-white p-6 pb-10 rounded-b-[2rem] relative overflow-hidden">
        {/* Nigerian-inspired pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 nigerian-pattern" />
        </div>

        {/* Animated accent circle */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/30 blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 relative z-10"
        >
          <p className="text-white/80 mb-1 font-medium">Welcome back,</p>
          <h1 className="text-white" style={{ fontSize: "1.875rem", fontWeight: 700, fontFamily: "Poppins" }}>
            {firstName}! 👋
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative z-10"
        >
          <Card className="p-6 bg-white/15 backdrop-blur-md border-white/30 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white/80 mb-2 font-medium">Your Progress</p>
                <h2 className="text-white mb-2" style={{ fontSize: "1.25rem", fontWeight: 600, fontFamily: "Poppins" }}>
                  Overall Completion
                </h2>
                <p className="text-white/90 text-sm">
                  {overallPercent === 0 ? "Start your learning journey!" : "Keep going! You're doing great."}
                </p>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <ProgressCircle progress={overallPercent} size={100} />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="p-6 space-y-6 -mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <StatCard icon={Flame} label="Day Streak" value={streakCurrent.toString()} iconColor="text-orange-500" iconBgColor="bg-orange-500/10" />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <StatCard icon={Zap} label="Total XP" value={xpTotal.toLocaleString()} iconColor="text-accent" iconBgColor="bg-accent/20" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3>Continue Learning</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("modules")}>
              View All
            </Button>
          </div>

          {inProgressModule ? (
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="p-5 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-primary/20"
                onClick={() => onNavigate("lesson", { moduleId: inProgressModuleFull?.id })}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10"
                  >
                    <BookOpen className="w-8 h-8 text-primary" />
                  </motion.div>
                  <div className="flex-1">
                    <Badge className="mb-2 bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-medium">
                      {inProgressModule.status === 'in_progress' ? 'In Progress' : 'Start'}
                    </Badge>
                    <h4 className="mb-1 font-semibold">{inProgressModule.moduleTitle}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {inProgressModule.lessonsCompleted}/{inProgressModule.totalLessons} lessons completed
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${inProgressModule.progressPercent}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                        />
                      </div>
                      <span className="text-sm font-semibold text-primary">{Math.round(inProgressModule.progressPercent)}%</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <motion.div
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Zap className="w-4 h-4 text-accent" />
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
            >
              <Card className="p-5 cursor-pointer hover:shadow-lg transition-all" onClick={() => onNavigate("modules")}>
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Get Started</h4>
                    <p className="text-sm text-muted-foreground">Browse available modules</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="mb-4 font-semibold">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Card className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-secondary/20" onClick={() => onNavigate("mock-test")}>
                <div className="flex flex-col items-center text-center gap-3">
                  <motion.div
                    whileHover={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10"
                  >
                    <PlayCircle className="w-8 h-8 text-secondary" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold">Mock Test</h4>
                    <p className="text-sm text-muted-foreground">Practice exam</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Card className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-accent/20" onClick={() => onNavigate("leaderboard")}>
                <div className="flex flex-col items-center text-center gap-3">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                    className="p-3 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10"
                  >
                    <Trophy className="w-8 h-8 text-accent-foreground" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold">Leaderboard</h4>
                    <p className="text-sm text-muted-foreground">See rankings</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {recentBadge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="mb-4">Recent Achievements</h3>
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-accent to-accent/60">
                  <TrendingUp className="w-6 h-6 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h4>{recentBadge.title}</h4>
                  <p className="text-sm text-muted-foreground">{recentBadge.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">+{recentBadge.xpReward} XP</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
