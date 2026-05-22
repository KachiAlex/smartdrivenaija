import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { motion } from "motion/react";
import {
  Zap,
  Trophy,
  Download,
  Bell,
  Moon,
  Globe,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";

export function ProfileScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  const { user, logout } = useAuth();
  const { progress } = useApp();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    onNavigate?.("login");
  };

  const xpTotal = progress?.xpTotal || user?.xpTotal || 0;
  const streakCurrent = progress?.streakCurrent || user?.streakCurrent || 0;
  const badges = progress?.badges || [];
  const modules = progress?.modules || [];
  const completedModules = modules.filter(m => m.status === 'completed').length;
  const totalLessons = modules.reduce((sum, m) => sum + m.totalLessons, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.lessonsCompleted, 0);
  const recentQuizzes = progress?.recentQuizzes?.length || 0;
  return (
    <div className="size-full overflow-auto bg-background pb-24">
      <div className="bg-gradient-to-br from-primary to-secondary text-white p-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Avatar className="w-20 h-20 border-4 border-white/20">
            <AvatarFallback className="bg-white/20 text-white text-2xl font-heading" style={{ fontWeight: 700 }}>
              {(user?.fullName || user?.phone || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-white mb-1" style={{ fontSize: "1.5rem" }}>
              {user?.fullName || 'Learner'}
            </h2>
            <p className="text-white/80">{user?.phone}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-heading text-white mb-1" style={{ fontWeight: 700 }}>
              {xpTotal.toLocaleString()}
            </p>
            <p className="text-xs text-white/70">Total XP</p>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-heading text-white mb-1" style={{ fontWeight: 700 }}>
              {badges.length}
            </p>
            <p className="text-xs text-white/70">Badges</p>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <div className="text-orange-400 text-xl">🔥</div>
            </div>
            <p className="text-2xl font-heading text-white mb-1" style={{ fontWeight: 700 }}>
              {streakCurrent}
            </p>
            <p className="text-xs text-white/70">Day Streak</p>
          </Card>
        </motion.div>
      </div>

      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="mb-4">Learning Progress</h3>
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Completed Modules</span>
              <Badge variant="secondary">{completedModules}/{modules.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Lessons Finished</span>
              <Badge variant="secondary">{completedLessons}/{totalLessons}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Quizzes Passed</span>
              <Badge variant="secondary">{recentQuizzes}</Badge>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4">Settings</h3>
          <Card className="divide-y">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-heading" style={{ fontWeight: 600 }}>Language</p>
                  <p className="text-sm text-muted-foreground">{user?.preferredLanguage || 'en'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="notifications" className="cursor-pointer">Notifications</Label>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor="dark-mode" className="cursor-pointer">Dark Mode</Label>
              </div>
              <Switch id="dark-mode" checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-heading" style={{ fontWeight: 600 }}>Offline Content</p>
                  <p className="text-sm text-muted-foreground">3 modules downloaded</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button variant="outline" className="w-full h-12 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleLogout}>
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
