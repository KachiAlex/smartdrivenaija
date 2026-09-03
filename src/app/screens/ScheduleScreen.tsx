import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { motion } from "motion/react";
import {
  ArrowLeft, Calendar, Target, Flame, TrendingUp, Clock,
  Bell, BellOff, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { api, type ScheduleInfo, type NotificationSettings } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

interface ScheduleScreenProps {
  onNavigate: (screen: string) => void;
}

export function ScheduleScreen({ onNavigate }: ScheduleScreenProps) {
  const { user, setTestDate } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(user?.testDate?.split('T')[0] || "");
  const [savingDate, setSavingDate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sched, notif] = await Promise.all([
        api.getSchedule(),
        api.getNotificationSettings(),
      ]);
      setSchedule(sched);
      setNotifications(notif);
    } catch {
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDate = async () => {
    if (!newDate) return;
    setSavingDate(true);
    try {
      await setTestDate(newDate);
      toast.success("Test date updated");
      setEditingDate(false);
      loadData();
    } catch {
      toast.error("Failed to update test date");
    } finally {
      setSavingDate(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    try {
      await api.updateNotificationPreferences({ enabled });
      setNotifications(prev => prev ? { ...prev, enabled } : null);
      toast.success(enabled ? "Notifications enabled" : "Notifications disabled");
    } catch {
      toast.error("Failed to update notifications");
    }
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-[#F0FDF4]">
        <Loader2 className="w-10 h-10 text-[#15803D] animate-spin" />
      </div>
    );
  }

  const phaseColors = {
    foundation: { bg: "#15803D", text: "Foundation Phase", desc: "Building your knowledge base" },
    intensive: { bg: "#F59E0B", text: "Intensive Phase", desc: "Ramping up your preparation" },
    cram: { bg: "#EF4444", text: "Final Cram", desc: "Every session counts" },
  };

  const phaseInfo = schedule?.phase ? phaseColors[schedule.phase] : null;

  return (
    <div className="size-full overflow-auto bg-[#F0FDF4] pb-28">
      {/* Header */}
      <div className="relative p-6 pb-10 rounded-b-[2.5rem] overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #15803D 0%, #22C55E 40%, #0A1F12 100%)" }}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#15803D]/30 blur-[80px]"
        />
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onNavigate("home")}
          className="relative z-10 flex items-center gap-2 mb-4 text-white/90 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <h1 className="text-white mb-2" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
            Study Schedule
          </h1>
          {schedule?.hasSchedule && schedule.daysToTest !== undefined && (
            <p className="text-white/80 text-lg">
              {schedule.daysToTest > 0
                ? `${schedule.daysToTest} days to your test`
                : "Test date has passed"}
            </p>
          )}
        </motion.div>
      </div>

      <div className="p-6 space-y-6 -mt-4 relative z-10">
        {/* No schedule state */}
        {!schedule?.hasSchedule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 glass-card border-[#22C55E]/10 text-center">
              <Calendar className="w-12 h-12 text-[#15803D] mx-auto mb-4" />
              <h3 className="text-[#14532D] font-bold mb-2" style={{ fontFamily: "Poppins" }}>
                Set Your Test Date
              </h3>
              <p className="text-[#4B7C5F] mb-4 text-sm">
                {schedule?.message || "Your test date generates your study schedule, daily goals, and notification timing."}
              </p>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-[#BBF7D0] bg-white text-[#14532D]"
                />
                <Button
                  onClick={handleSaveDate}
                  disabled={!newDate || savingDate}
                  className="text-white"
                  style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
                >
                  {savingDate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set"}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Schedule overview */}
        {schedule?.hasSchedule && (
          <>
            {/* Phase banner */}
            {phaseInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-5 glass-card border-[#22C55E]/10">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl flex-shrink-0" style={{ backgroundColor: `${phaseInfo.bg}15` }}>
                      <Target className="w-8 h-8" style={{ color: phaseInfo.bg }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#14532D] font-bold" style={{ fontFamily: "Poppins" }}>
                        {phaseInfo.text}
                      </h3>
                      <p className="text-[#4B7C5F] text-sm">{phaseInfo.desc}</p>
                    </div>
                    {schedule.daysToTest !== undefined && schedule.daysToTest > 0 && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#14532D]" style={{ fontFamily: "Poppins" }}>
                          {schedule.daysToTest}
                        </div>
                        <div className="text-xs text-[#4B7C5F]">days left</div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Readiness vs target */}
            {schedule.readinessScore !== null && schedule.readinessScore !== undefined && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-5 glass-card border-[#22C55E]/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#14532D] font-semibold" style={{ fontFamily: "Poppins" }}>
                      Readiness Target
                    </span>
                    <Badge className="bg-[#15803D]/10 text-[#15803D] border-0">
                      {schedule.sessionsToTarget} sessions to target
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-3 mb-3">
                    <div>
                      <p className="text-xs text-[#4B7C5F] mb-1">Current</p>
                      <p className="text-2xl font-bold text-[#14532D]" style={{ fontFamily: "Poppins" }}>
                        {schedule.readinessScore}%
                      </p>
                    </div>
                    <TrendingUp className="w-5 h-5 text-[#15803D]" />
                    <div>
                      <p className="text-xs text-[#4B7C5F] mb-1">Target</p>
                      <p className="text-2xl font-bold text-[#15803D]" style={{ fontFamily: "Poppins" }}>
                        {schedule.targetReadiness}%
                      </p>
                    </div>
                    <div className="flex-1" />
                    <div className="text-right">
                      <p className="text-xs text-[#4B7C5F] mb-1">Gap</p>
                      <p className="text-2xl font-bold text-[#F59E0B]" style={{ fontFamily: "Poppins" }}>
                        {schedule.readinessGap}%
                      </p>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-[#BBF7D0] overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-[#15803D] transition-all"
                      style={{ width: `${schedule.readinessScore}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-[#F59E0B] rounded-full"
                      style={{ left: `${schedule.targetReadiness}%` }}
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Test date editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="p-5 glass-card border-[#22C55E]/10">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-[#15803D]" />
                  <span className="text-[#14532D] font-semibold" style={{ fontFamily: "Poppins" }}>
                    Test Date
                  </span>
                </div>
                {editingDate ? (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border-2 border-[#BBF7D0] bg-white text-[#14532D]"
                    />
                    <Button size="sm" onClick={handleSaveDate} disabled={savingDate || !newDate}
                      className="text-white" style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}>
                      {savingDate ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingDate(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[#4B7C5F]">
                      {schedule.testDate ? new Date(schedule.testDate).toLocaleDateString('en-GB', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      }) : 'Not set'}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setNewDate(schedule.testDate?.split('T')[0] || "");
                      setEditingDate(true);
                    }} className="text-[#15803D]">
                      Edit
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Weak topics */}
            {schedule.weakTopics && schedule.weakTopics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-[#14532D] font-bold mb-3" style={{ fontFamily: "Poppins" }}>
                  Priority Topics
                </h3>
                <div className="space-y-2">
                  {schedule.weakTopics.map((topic, i) => (
                    <motion.div
                      key={topic.topicTag}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 + i * 0.05 }}
                    >
                      <Card className="p-3 glass-card border-[#EF4444]/10 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-[#14532D] font-medium text-sm capitalize">
                            {topic.topicTag.replace(/-/g, " ")}
                          </p>
                          <div className="h-1.5 rounded-full bg-[#BBF7D0] overflow-hidden mt-1">
                            <div className="h-full rounded-full bg-[#EF4444]" style={{ width: `${topic.mastery}%` }} />
                          </div>
                        </div>
                        <span className="text-[#EF4444] font-bold text-sm">{topic.mastery}%</span>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weekly milestones */}
            {schedule.milestones && schedule.milestones.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <h3 className="text-[#14532D] font-bold mb-3" style={{ fontFamily: "Poppins" }}>
                  Weekly Milestones
                </h3>
                <div className="space-y-2">
                  {schedule.milestones.map((m, i) => {
                    const focusLabels = {
                      new_content: "New content",
                      weak_topics: "Weak topics",
                      mock_tests: "Mock tests",
                    };
                    return (
                      <motion.div
                        key={m.week}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                      >
                        <Card className="p-3 glass-card border-[#22C55E]/10 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#15803D]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#15803D] font-bold text-sm">{m.week}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-[#14532D] font-medium text-sm">{focusLabels[m.focus]}</p>
                            <p className="text-[#4B7C5F] text-xs">
                              {m.daysRemaining > 0 ? `${m.daysRemaining} days remaining` : "Test week"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#15803D] font-bold text-sm">{m.targetReadiness}%</p>
                            <p className="text-[#4B7C5F] text-xs">target</p>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Notification settings */}
            {notifications && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-[#14532D] font-bold mb-3" style={{ fontFamily: "Poppins" }}>
                  Notifications
                </h3>
                <Card className="p-5 glass-card border-[#22C55E]/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {notifications.enabled ? (
                        <Bell className="w-5 h-5 text-[#15803D]" />
                      ) : (
                        <BellOff className="w-5 h-5 text-[#4B7C5F]" />
                      )}
                      <div>
                        <p className="text-[#14532D] font-medium text-sm">
                          {notifications.enabled ? "Enabled" : "Disabled"}
                        </p>
                        <p className="text-[#4B7C5F] text-xs">{notifications.cadence.label}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleNotifications(!notifications.enabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications.enabled ? "bg-[#15803D]" : "bg-[#BBF7D0]"
                      }`}
                    >
                      <motion.div
                        animate={{ x: notifications.enabled ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"
                      />
                    </button>
                  </div>

                  {notifications.enabled && (
                    <div className="space-y-2 pt-3 border-t border-[#BBF7D0]">
                      {notifications.nextReminder && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-[#15803D]" />
                          <span className="text-[#4B7C5F]">
                            Next: {notifications.nextReminder.scheduledFor}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Flame className="w-4 h-4 text-[#F59E0B]" />
                        <span className="text-[#4B7C5F]">
                          {schedule.streakCurrent || 0} day streak — don't break it!
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Start session CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Button
                onClick={() => onNavigate("session")}
                className="w-full h-12 text-white"
                size="lg"
                style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Start Today's Session
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
