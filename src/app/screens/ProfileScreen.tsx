import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap,
  Trophy,
  Download,
  Bell,
  Moon,
  Globe,
  LogOut,
  ChevronRight,
  Star,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function ProfileScreen({ onNavigate }: { onNavigate?: (screen: string) => void }) {
  const { user, logout, changePassword } = useAuth();
  const { progress } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [driverScore, setDriverScore] = useState<{ driverScore: number; scoreBreakdown: any } | null>(null);

  // Change password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    const fetchDriverScore = async () => {
      try {
        const scoreData = await api.getDriverScore();
        setDriverScore(scoreData);
      } catch (error) {
        console.error('Failed to fetch driver score:', error);
      }
    };
    fetchDriverScore();
  }, []);

  const handleLogout = async () => {
    await logout();
    onNavigate?.("login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    setChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      toast.success('Password changed successfully');
      setShowChangePw(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
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
    <div className="size-full overflow-auto bg-[#FAFBFF] pb-28">
      {/* Cosmic header with mesh gradient */}
      <div className="relative p-6 pb-12 rounded-b-[2.5rem] overflow-hidden"
        style={{ background: "linear-gradient(135deg, #E63946 0%, #F4A261 40%, #0A1628 100%)" }}
      >
        {/* Animated mesh blobs */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#E63946]/30 blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-[#F4A261]/20 blur-[70px]"
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6 relative z-10"
        >
          <Avatar className="w-20 h-20 border-4 border-white/20 glow-pulse">
            <AvatarFallback className="bg-white/20 text-white text-2xl" style={{ fontWeight: 700, fontFamily: "Poppins" }}>
              {(user?.fullName || user?.phone || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-white mb-1" style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "Poppins" }}>
              {user?.fullName || 'Learner'}
            </h2>
            <p className="text-white/80">{user?.phone}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 relative z-10"
        >
          <Card className="p-4 glass-card border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <Zap className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <p className="text-2xl text-white mb-1" style={{ fontWeight: 700, fontFamily: "Poppins" }}>
              {xpTotal.toLocaleString()}
            </p>
            <p className="text-xs text-white/70">Total XP</p>
          </Card>

          <Card className="p-4 glass-card border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <Trophy className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <p className="text-2xl text-white mb-1" style={{ fontWeight: 700, fontFamily: "Poppins" }}>
              {badges.length}
            </p>
            <p className="text-xs text-white/70">Badges</p>
          </Card>

          <Card className="p-4 glass-card border-white/20 text-center">
            <div className="flex justify-center mb-2">
              <div className="text-orange-400 text-xl">🔥</div>
            </div>
            <p className="text-2xl text-white mb-1" style={{ fontWeight: 700, fontFamily: "Poppins" }}>
              {streakCurrent}
            </p>
            <p className="text-xs text-white/70">Day Streak</p>
          </Card>
        </motion.div>
      </div>

      <div className="p-6 space-y-6 -mt-4 relative z-10">
        {/* Smart Driver Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-5 glass-card border-2 border-[#E63946]/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#0F172A] font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-[#E63946]" />
                Smart Driver Score
              </h3>
              <Badge className="bg-[#E63946] text-white border-[#E63946]">
                {driverScore?.driverScore || 0}/100
              </Badge>
            </div>
            {driverScore?.scoreBreakdown && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">Modules</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#E63946] rounded-full transition-all"
                        style={{ width: `${driverScore.scoreBreakdown.modules}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A]">{driverScore.scoreBreakdown.modules}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">Quizzes</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#F4A261] rounded-full transition-all"
                        style={{ width: `${driverScore.scoreBreakdown.quizzes}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A]">{driverScore.scoreBreakdown.quizzes}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">Streak</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#F59E0B] rounded-full transition-all"
                        style={{ width: `${driverScore.scoreBreakdown.streak}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A]">{driverScore.scoreBreakdown.streak}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748B]">XP</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#10B981] rounded-full transition-all"
                        style={{ width: `${driverScore.scoreBreakdown.xp}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A]">{driverScore.scoreBreakdown.xp}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4 text-[#0F172A] font-bold">Learning Progress</h3>
          <Card className="p-4 space-y-4 glass-card border-[#E63946]/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Completed Modules</span>
              <Badge className="bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20">{completedModules}/{modules.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Lessons Finished</span>
              <Badge className="bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20">{completedLessons}/{totalLessons}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Quizzes Passed</span>
              <Badge className="bg-[#E63946]/10 text-[#E63946] border-[#E63946]/20">{recentQuizzes}</Badge>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4 text-[#0F172A] font-bold">Settings</h3>
          <Card className="divide-y glass-card border-[#E63946]/10">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#64748B]" />
                <div>
                  <p className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>Language</p>
                  <p className="text-sm text-[#64748B]">{user?.preferredLanguage || 'en'}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#64748B]" />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[#64748B]" />
                <Label htmlFor="notifications" className="cursor-pointer text-[#0F172A]">Notifications</Label>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-[#64748B]" />
                <Label htmlFor="dark-mode" className="cursor-pointer text-[#0F172A]">Dark Mode</Label>
              </div>
              <Switch id="dark-mode" checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-[#64748B]" />
                <div>
                  <p className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>Offline Content</p>
                  <p className="text-sm text-[#64748B]">3 modules downloaded</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#64748B]" />
            </div>

            {/* Change Password */}
            <button
              type="button"
              onClick={() => setShowChangePw(v => !v)}
              className="w-full p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#64748B]" />
                <p className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>Change Password</p>
              </div>
              <motion.div animate={{ rotate: showChangePw ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-5 h-5 text-[#64748B]" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showChangePw && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleChangePassword} className="px-4 pb-4 pt-1 space-y-3 bg-[#F8FAFC]">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Current password"
                        value={currentPw}
                        onChange={e => setCurrentPw(e.target.value)}
                        className="pl-10 h-11 border-2 border-[#E2E8F0] bg-white rounded-xl text-sm"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        type={showPw ? 'text' : 'password'}
                        placeholder="New password (min 6 chars)"
                        value={newPw}
                        onChange={e => setNewPw(e.target.value)}
                        className="pl-10 pr-10 h-11 border-2 border-[#E2E8F0] bg-white rounded-xl text-sm"
                        required
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <Input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmPw}
                        onChange={e => setConfirmPw(e.target.value)}
                        className={`pl-10 h-11 border-2 bg-white rounded-xl text-sm ${
                          confirmPw && confirmPw !== newPw ? 'border-red-400' : 'border-[#E2E8F0]'
                        }`}
                        required
                      />
                    </div>
                    {confirmPw && confirmPw !== newPw && (
                      <p className="text-xs text-red-500">Passwords do not match</p>
                    )}
                    <Button
                      type="submit"
                      className="w-full h-10 text-white text-sm font-semibold rounded-xl"
                      disabled={changingPw || !currentPw || newPw.length < 6 || newPw !== confirmPw}
                      style={{ background: 'linear-gradient(135deg, #1D3557, #0A1628)' }}
                    >
                      {changingPw ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save New Password'}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="w-full h-12 text-red-400 border-red-400/30 hover:bg-red-50 hover:text-red-500" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
