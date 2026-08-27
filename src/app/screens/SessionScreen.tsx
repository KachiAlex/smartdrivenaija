import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, ArrowRight, Check, X, Flame, Target, Zap,
  Loader2, PlayCircle, Video, Sparkles, TrendingUp, Clock,
} from "lucide-react";
import { api, type TodaySession, type SessionQuestion } from "../lib/api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface SessionScreenProps {
  onNavigate: (screen: string, data?: { moduleId?: number }) => void;
}

type Movement = "intro" | "warmup" | "newground-lesson" | "newground-quiz" | "clip" | "close";

export function SessionScreen({ onNavigate }: SessionScreenProps) {
  const { loadReadiness, loadProgress } = useApp();
  const { user } = useAuth();
  const [session, setSession] = useState<TodaySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [movement, setMovement] = useState<Movement>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [warmupAnswers, setWarmupAnswers] = useState<{ questionId: number; selected: number; timeMs: number }[]>([]);
  const [warmupScore, setWarmupScore] = useState(0);
  const [newGroundLessonIndex, setNewGroundLessonIndex] = useState(0);
  const [newGroundQuizAnswers, setNewGroundQuizAnswers] = useState<{ questionId: number; selected: number; timeMs: number }[]>([]);
  const [newGroundScore, setNewGroundScore] = useState(0);
  const sessionStartTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [closeData, setCloseData] = useState<{ readinessScore: number | null; streakCurrent: number; xpTotal: number } | null>(null);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const data = await api.getTodaySession();
      setSession(data);
    } catch (err) {
      toast.error("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentQuestionIndex, movement]);

  const handleAnswerSelect = useCallback((idx: number) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
  }, [showFeedback]);

  const handleAnswerSubmit = useCallback(() => {
    if (selectedAnswer === null || !session) return;
    setShowFeedback(true);
  }, [selectedAnswer, session]);

  const handleNextQuestion = useCallback(() => {
    if (!session) return;
    const timeMs = Date.now() - questionStartTime.current;

    if (movement === "warmup") {
      const questions = session.warmup;
      const newAnswers = [...warmupAnswers, {
        questionId: questions[currentQuestionIndex].id,
        selected: selectedAnswer!,
        timeMs,
      }];
      setWarmupAnswers(newAnswers);

      if (questions[currentQuestionIndex].answer === selectedAnswer) {
        setWarmupScore(s => s + 1);
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // Submit warmup
        api.submitWarmup(newAnswers).catch(() => {});
        setMovement("newground-lesson");
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    } else if (movement === "newground-quiz") {
      const questions = session.newGround?.questions || [];
      const newAnswers = [...newGroundQuizAnswers, {
        questionId: questions[currentQuestionIndex].id,
        selected: selectedAnswer!,
        timeMs,
      }];
      setNewGroundQuizAnswers(newAnswers);

      if (questions[currentQuestionIndex].answer === selectedAnswer) {
        setNewGroundScore(s => s + 1);
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setMovement("clip");
        setSelectedAnswer(null);
        setShowFeedback(false);
      }
    }
  }, [session, movement, currentQuestionIndex, selectedAnswer, warmupAnswers, newGroundQuizAnswers]);

  const handleCompleteSession = async () => {
    setSubmitting(true);
    try {
      const durationSeconds = Math.round((Date.now() - sessionStartTime.current) / 1000);
      const result = await api.completeSession({
        warmupScore,
        warmupTotal: session?.warmup.length || 0,
        newGroundCompleted: true,
        durationSeconds,
      });
      setCloseData({
        readinessScore: result.readinessScore,
        streakCurrent: result.streakCurrent,
        xpTotal: result.xpTotal,
      });
      setMovement("close");
      await loadReadiness();
      await loadProgress();

      // Celebrate
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#15803D", "#22C55E", "#BBF7D0"],
      });
    } catch {
      toast.error("Failed to complete session");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="size-full flex items-center justify-center bg-[#F0FDF4]">
        <Loader2 className="w-10 h-10 text-[#15803D] animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="size-full flex flex-col items-center justify-center bg-[#F0FDF4] p-6">
        <p className="text-[#4B7C5F] mb-4">Could not load your session.</p>
        <Button onClick={() => onNavigate("home")} variant="outline">Back to Home</Button>
      </div>
    );
  }

  // ── Already completed today ──────────────────────────────────
  if (session.alreadyCompletedToday && movement === "intro") {
    return (
      <div className="size-full flex flex-col items-center justify-center bg-[#F0FDF4] p-6 pb-28">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="p-8 rounded-full bg-[#15803D]/10 mb-6"
        >
          <Check className="w-16 h-16 text-[#15803D]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 max-w-md"
        >
          <h1 className="mb-3 text-[#14532D]" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
            Today's Session Complete
          </h1>
          <p className="text-[#4B7C5F] text-lg leading-relaxed">
            You already finished your daily session. Come back tomorrow for your next set.
          </p>
          {session.daysToTest !== null && session.daysToTest > 0 && (
            <p className="text-[#15803D] mt-4 font-medium">
              {session.daysToTest} days to your test
            </p>
          )}
        </motion.div>
        <Button
          onClick={() => onNavigate("home")}
          className="h-12 px-8 text-white"
          size="lg"
          style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
        >
          Back to Home
        </Button>
      </div>
    );
  }

  // ── Intro screen ─────────────────────────────────────────────
  if (movement === "intro") {
    const movements = [
      { icon: Flame, title: "Warm-up", desc: `${session.warmup.length} review items`, color: "#F59E0B" },
      { icon: TrendingUp, title: "New Ground", desc: session.newGround ? `${session.newGround.lessons.length} lessons + ${session.newGround.questions.length} questions` : "Coming next", color: "#15803D" },
      { icon: Video, title: "The Clip", desc: session.clip.available ? "Hazard perception" : "Coming soon", color: "#8B5CF6" },
      { icon: Target, title: "Close", desc: "Bank your streak", color: "#22C55E" },
    ];

    return (
      <div className="size-full flex flex-col bg-[#F0FDF4]">
        <div className="relative p-6 pb-8 rounded-b-[2.5rem] overflow-hidden text-white"
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
            <h1 className="mb-2 text-white" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
              Today's Session
            </h1>
            <p className="text-white/80 text-lg">~7 minutes • Four movements</p>
            {session.daysToTest !== null && session.daysToTest > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{session.daysToTest} days to test</span>
              </div>
            )}
          </motion.div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-3">
          {movements.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <Card className="p-4 flex items-center gap-4 glass-card border-[#22C55E]/10">
                  <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: `${m.color}15` }}>
                    <Icon className="w-6 h-6" style={{ color: m.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[#14532D] font-semibold" style={{ fontFamily: "Poppins" }}>{m.title}</h3>
                    <p className="text-[#4B7C5F] text-sm">{m.desc}</p>
                  </div>
                  <div className="text-[#4B7C5F]/40 text-sm font-medium">{i + 1}</div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="p-6 border-t border-[#BBF7D0] bg-white">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => {
                if (session.warmup.length > 0) {
                  setMovement("warmup");
                } else if (session.newGround) {
                  setMovement("newground-lesson");
                } else {
                  setMovement("clip");
                }
              }}
              className="w-full h-12 text-white"
              size="lg"
              style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
            >
              <PlayCircle className="w-5 h-5 mr-2" />
              Start Session
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Warm-up movement ─────────────────────────────────────────
  if (movement === "warmup") {
    const questions = session.warmup;
    if (questions.length === 0) {
      // Skip to new ground
      setMovement("newground-lesson");
      return null;
    }
    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <QuestionView
        title="Warm-up"
        subtitle="Review items due today"
        icon={Flame}
        iconColor="#F59E0B"
        progress={progress}
        progressLabel={`${currentQuestionIndex + 1}/${questions.length}`}
        question={q}
        selectedAnswer={selectedAnswer}
        showFeedback={showFeedback}
        onSelect={handleAnswerSelect}
        onSubmit={handleAnswerSubmit}
        onNext={handleNextQuestion}
        onBack={() => onNavigate("home")}
        isLast={currentQuestionIndex === questions.length - 1}
      />
    );
  }

  // ── New ground: lesson reading ───────────────────────────────
  if (movement === "newground-lesson" && session.newGround) {
    const lessons = session.newGround.lessons;
    if (lessons.length === 0) {
      setMovement("newground-quiz");
      return null;
    }
    const lesson = lessons[newGroundLessonIndex];
    const progress = ((newGroundLessonIndex + 1) / lessons.length) * 100;

    const renderContent = (text: string) => {
      const paragraphs = text.split('\n\n');
      return paragraphs.map((para, i) => {
        if (para.startsWith('**') && para.endsWith('**')) {
          return <h4 key={i} className="mt-4 mb-2 text-[#14532D] font-bold text-lg" style={{ fontFamily: "Poppins" }}>{para.replace(/\*\*/g, '')}</h4>;
        }
        if (para.includes('•')) {
          const lines = para.split('\n').filter(l => l.trim());
          const heading = lines[0]?.startsWith('•') ? null : lines.shift();
          return (
            <div key={i} className="space-y-2">
              {heading && <p className="text-[#4B7C5F] font-medium">{heading}</p>}
              <ul className="space-y-2 ml-1">
                {lines.map((line, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-[#15803D] mt-0.5 flex-shrink-0" />
                    <span className="text-[#4B7C5F] leading-relaxed">{line.replace(/^•\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        return <p key={i} className="text-[#14532D] leading-relaxed">{para}</p>;
      });
    };

    return (
      <div className="size-full flex flex-col bg-[#F0FDF4]">
        <div className="relative p-6 pb-6 rounded-b-[2.5rem] overflow-hidden text-white"
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

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mb-4">
            <Badge className="mb-2 bg-white/20 text-white border-white/30">
              {session.newGround.module.title}
            </Badge>
            <h2 className="text-white mb-1" style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "Poppins" }}>
              {lesson.title}
            </h2>
            <p className="text-white/80">{lesson.estimatedMinutes} min • {lesson.xpReward} XP</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10 flex items-center gap-2">
            <Progress value={progress} className="flex-1 h-2 bg-white/20" />
            <span className="text-sm font-medium">{newGroundLessonIndex + 1}/{lessons.length}</span>
          </motion.div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4 bg-[#F0FDF4]">
          <motion.div
            key={newGroundLessonIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <h3 className="text-[#14532D] text-xl font-bold" style={{ fontFamily: "Poppins" }}>{lesson.title}</h3>
            {renderContent(lesson.content)}
          </motion.div>
        </div>

        <div className="p-6 border-t border-[#BBF7D0] bg-white">
          <Button
            onClick={() => {
              if (newGroundLessonIndex < lessons.length - 1) {
                setNewGroundLessonIndex(i => i + 1);
              } else {
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setShowFeedback(false);
                setMovement("newground-quiz");
              }
            }}
            className="w-full h-12 text-white"
            size="lg"
            style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
          >
            {newGroundLessonIndex < lessons.length - 1 ? "Next Lesson" : "Start Questions"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── New ground: quiz ─────────────────────────────────────────
  if (movement === "newground-quiz" && session.newGround) {
    const questions = session.newGround.questions;
    if (questions.length === 0) {
      setMovement("clip");
      return null;
    }
    const q = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <QuestionView
        title="New Ground"
        subtitle={session.newGround.module.title}
        icon={TrendingUp}
        iconColor="#15803D"
        progress={progress}
        progressLabel={`${currentQuestionIndex + 1}/${questions.length}`}
        question={q}
        selectedAnswer={selectedAnswer}
        showFeedback={showFeedback}
        onSelect={handleAnswerSelect}
        onSubmit={handleAnswerSubmit}
        onNext={handleNextQuestion}
        onBack={() => onNavigate("home")}
        isLast={currentQuestionIndex === questions.length - 1}
      />
    );
  }

  // ── The clip (hazard perception placeholder) ─────────────────
  if (movement === "clip") {
    return (
      <div className="size-full flex flex-col bg-[#F0FDF4]">
        <div className="relative p-6 pb-8 rounded-b-[2.5rem] overflow-hidden text-white"
          style={{ background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 40%, #3B0764 100%)" }}
        >
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onNavigate("home")}
            className="relative z-10 flex items-center gap-2 mb-4 text-white/90 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </motion.button>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
            <h1 className="text-white mb-1" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
              The Clip
            </h1>
            <p className="text-white/80">Hazard Perception</p>
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-8 rounded-full bg-[#8B5CF6]/10 mb-6"
          >
            <Video className="w-20 h-20 text-[#8B5CF6]" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center max-w-md mb-8"
          >
            <h2 className="mb-3 text-[#14532D]" style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "Poppins" }}>
              {session.clip.title}
            </h2>
            <p className="text-[#4B7C5F] text-lg leading-relaxed">{session.clip.description}</p>
          </motion.div>
        </div>

        <div className="p-6 border-t border-[#BBF7D0] bg-white">
          <Button
            onClick={handleCompleteSession}
            disabled={submitting}
            className="w-full h-12 text-white"
            size="lg"
            style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
          >
            {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Finishing...</> : "Finish Session"}
            {!submitting && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>
    );
  }

  // ── Close movement ───────────────────────────────────────────
  if (movement === "close") {
    const prevReadiness = session.close.readinessScore;
    const newReadiness = closeData?.readinessScore ?? prevReadiness;
    const delta = newReadiness !== null && prevReadiness !== null ? newReadiness - prevReadiness : 0;

    return (
      <div className="size-full flex flex-col bg-[#F0FDF4]">
        <div className="relative p-6 pb-8 rounded-b-[2.5rem] overflow-hidden text-white"
          style={{ background: "linear-gradient(135deg, #15803D 0%, #22C55E 40%, #0A1F12 100%)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#15803D]/30 blur-[80px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex p-6 rounded-full bg-white/15 mb-4"
            >
              <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-white mb-2" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
              Session Complete!
            </h1>
            <p className="text-white/80 text-lg">Great work today</p>
          </motion.div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Readiness delta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 glass-card border-[#22C55E]/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#15803D]" />
                  <span className="text-[#14532D] font-semibold" style={{ fontFamily: "Poppins" }}>Readiness</span>
                </div>
                {delta > 0 && (
                  <Badge className="bg-[#22C55E] text-[#14532D] border-0">
                    <TrendingUp className="w-3 h-3 mr-1" /> +{delta}%
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#14532D]" style={{ fontFamily: "Poppins" }}>
                  {newReadiness !== null ? `${newReadiness}%` : "—"}
                </span>
                {prevReadiness !== null && prevReadiness !== newReadiness && (
                  <span className="text-[#4B7C5F] text-lg line-through">{prevReadiness}%</span>
                )}
              </div>
              <Progress value={newReadiness || 0} className="mt-3 h-2" />
            </Card>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-4 glass-card border-[#22C55E]/10 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#F59E0B]/10">
                <Flame className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div className="flex-1">
                <p className="text-[#14532D] font-semibold" style={{ fontFamily: "Poppins" }}>
                  {closeData?.streakCurrent || session.close.streakCurrent} day streak
                </p>
                <p className="text-[#4B7C5F] text-sm">Keep it going tomorrow!</p>
              </div>
            </Card>
          </motion.div>

          {/* XP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-4 glass-card border-[#22C55E]/10 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#15803D]/10">
                <Zap className="w-6 h-6 text-[#15803D]" />
              </div>
              <div className="flex-1">
                <p className="text-[#14532D] font-semibold" style={{ fontFamily: "Poppins" }}>
                  {closeData?.xpTotal || session.close.xpTotal} XP total
                </p>
                <p className="text-[#4B7C5F] text-sm">Earned across all sessions</p>
              </div>
            </Card>
          </motion.div>

          {/* Tomorrow preview */}
          {session.daysToTest !== null && session.daysToTest > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-4 glass-card border-[#22C55E]/10">
                <p className="text-[#4B7C5F] text-sm leading-relaxed">
                  <span className="font-semibold text-[#14532D]">Tomorrow:</span> {session.daysToTest - 1} days until your test. We will review items that are due and cover new ground.
                </p>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="p-6 border-t border-[#BBF7D0] bg-white">
          <Button
            onClick={() => onNavigate("home")}
            className="w-full h-12 text-white"
            size="lg"
            style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Reusable question view component ───────────────────────────
function QuestionView({
  title, subtitle, icon: Icon, iconColor, progress, progressLabel,
  question, selectedAnswer, showFeedback, onSelect, onSubmit, onNext, onBack, isLast,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  progress: number;
  progressLabel: string;
  question: SessionQuestion;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onSelect: (idx: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onBack: () => void;
  isLast: boolean;
}) {
  return (
    <div className="size-full flex flex-col bg-[#F0FDF4]">
      <div className="relative p-6 pb-6 rounded-b-[2.5rem] overflow-hidden text-white"
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
          onClick={onBack}
          className="relative z-10 flex items-center gap-2 mb-4 text-white/90 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5" style={{ color: iconColor } as React.CSSProperties} />
            <span className="text-white/90 font-medium">{title}</span>
          </div>
          <p className="text-white/70 text-sm">{subtitle}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative z-10 flex items-center gap-2">
          <Progress value={progress} className="flex-1 h-2 bg-white/20" />
          <span className="text-sm font-medium">{progressLabel}</span>
        </motion.div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {question.isReview && (
              <Badge className="mb-3 bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/20">
                <Flame className="w-3 h-3 mr-1" /> Review
              </Badge>
            )}
            <h3 className="text-[#14532D] text-xl font-bold mb-6" style={{ fontFamily: "Poppins" }}>
              {question.question}
            </h3>
            <div className="space-y-3">
              {question.options.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === question.answer;
                const showCorrect = showFeedback && isCorrect;
                const showWrong = showFeedback && isSelected && !isCorrect;

                return (
                  <motion.button
                    key={idx}
                    whileHover={!showFeedback ? { scale: 1.02 } : {}}
                    whileTap={!showFeedback ? { scale: 0.98 } : {}}
                    onClick={() => onSelect(idx)}
                    disabled={showFeedback}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      showCorrect
                        ? "border-[#22C55E] bg-[#22C55E]/10"
                        : showWrong
                        ? "border-[#EF4444] bg-[#EF4444]/10"
                        : isSelected
                        ? "border-[#15803D] bg-[#15803D]/5"
                        : "border-[#BBF7D0] bg-white hover:border-[#15803D]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#14532D] font-medium">{opt}</span>
                      {showCorrect && <Check className="w-5 h-5 text-[#22C55E]" />}
                      {showWrong && <X className="w-5 h-5 text-[#EF4444]" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]"
              >
                <p className="text-[#4B7C5F] text-sm leading-relaxed">
                  <span className="font-semibold text-[#14532D]">Explanation: </span>
                  {question.explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-[#BBF7D0] bg-white">
        {!showFeedback ? (
          <Button
            onClick={onSubmit}
            disabled={selectedAnswer === null}
            className="w-full h-12 text-white"
            size="lg"
            style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
          >
            Check Answer
          </Button>
        ) : (
          <Button
            onClick={onNext}
            className="w-full h-12 text-white"
            size="lg"
            style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
          >
            {isLast ? "Continue" : "Next Question"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
