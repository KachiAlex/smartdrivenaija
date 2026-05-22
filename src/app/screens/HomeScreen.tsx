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
      <div className="bg-gradient-to-br from-primary to-secondary text-white p-6 pb-8 rounded-b-3xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-white/80 mb-1">Welcome back,</p>
          <h1 className="text-white" style={{ fontSize: "1.75rem" }}>
            {firstName}! 👋
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white/80 mb-1">Your Progress</p>
                <h2 className="text-white mb-1" style={{ fontSize: "1.5rem" }}>
                  Overall Completion
                </h2>
                <p className="text-white/90">
                  {overallPercent === 0 ? "Start your learning journey!" : "Keep going! You're doing great."}
                </p>
              </div>
              <ProgressCircle progress={overallPercent} size={100} />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <StatCard icon={Flame} label="Day Streak" value={streakCurrent.toString()} iconColor="text-orange-500" iconBgColor="bg-orange-500/10" />
          <StatCard icon={Zap} label="Total XP" value={xpTotal.toLocaleString()} iconColor="text-accent" iconBgColor="bg-accent/20" />
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
            <Card
              className="p-5 cursor-pointer hover:shadow-md transition-all"
              onClick={() => onNavigate("lesson", { moduleId: inProgressModuleFull?.id })}
            >
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <Badge className="mb-2 bg-accent text-accent-foreground">
                    {inProgressModule.status === 'in_progress' ? 'In Progress' : 'Start'}
                  </Badge>
                  <h4 className="mb-1">{inProgressModule.moduleTitle}</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {inProgressModule.lessonsCompleted}/{inProgressModule.totalLessons} lessons completed
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${inProgressModule.progressPercent}%` }} />
                    </div>
                    <span className="text-sm font-heading" style={{ fontWeight: 600 }}>{Math.round(inProgressModule.progressPercent)}%</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-accent" />
                      {inProgressModuleFull?.xpReward || 500} XP
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-5 cursor-pointer hover:shadow-md transition-all" onClick={() => onNavigate("modules")}>
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h4 className="mb-1">Get Started</h4>
                  <p className="text-sm text-muted-foreground">Browse available modules</p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => onNavigate("mock-test")}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <PlayCircle className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <h4>Mock Test</h4>
                  <p className="text-sm text-muted-foreground">Practice exam</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => onNavigate("leaderboard")}>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-accent/20">
                  <Trophy className="w-8 h-8 text-accent-foreground" />
                </div>
                <div>
                  <h4>Leaderboard</h4>
                  <p className="text-sm text-muted-foreground">See rankings</p>
                </div>
              </div>
            </Card>
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
