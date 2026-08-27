import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Loader2, ArrowRight, CheckCircle2, Brain, TrendingUp } from "lucide-react";
import { api, type DiagnosticQuestion, type TopicMastery } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface DiagnosticScreenProps {
  onComplete: (readinessScore: number) => void;
  onSkip: () => void;
}

export function DiagnosticScreen({ onComplete, onSkip }: DiagnosticScreenProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; selected: number; topicTag: string }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"intro" | "quiz" | "results">("intro");
  const [readinessScore, setReadinessScore] = useState(0);
  const [topicMastery, setTopicMastery] = useState<TopicMastery[]>([]);

  const startDiagnostic = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getDiagnosticQuestions();
      setQuestions(data.questions);
      setPhase("quiz");
    } catch (err) {
      console.error("Failed to load diagnostic:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const q = questions[currentIndex];
    const newAnswers = [...answers, { questionId: q.id, selected: selectedOption, topicTag: q.topicTag }];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitDiagnostic(newAnswers);
    }
  };

  const submitDiagnostic = async (allAnswers: { questionId: number; selected: number; topicTag: string }[]) => {
    setSubmitting(true);
    try {
      const data = await api.submitDiagnostic(allAnswers);
      setReadinessScore(data.readinessScore);
      setTopicMastery(data.topicMastery);
      setPhase("results");
    } catch (err) {
      console.error("Failed to submit diagnostic:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A1F12] overflow-y-auto">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] right-[5%] w-72 h-72 rounded-full bg-[#15803D]/20 blur-[80px] pointer-events-none"
      />

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* ── Intro ── */}
            {phase === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#15803D]/20 mb-2">
                    <Brain className="w-8 h-8 text-[#4ADE80]" />
                  </div>
                  <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Poppins" }}>
                    Find your starting point
                  </h1>
                  <p className="text-white/70 text-sm">
                    12 quick questions across all topics. We'll estimate your readiness and build a plan from there.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#4ADE80] flex-shrink-0" />
                    <span className="text-white/80 text-sm">Takes about 5 minutes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#4ADE80] flex-shrink-0" />
                    <span className="text-white/80 text-sm">No pressure — this just sets your baseline</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#4ADE80] flex-shrink-0" />
                    <span className="text-white/80 text-sm">You'll see your readiness score after</span>
                  </div>
                </div>

                <Button
                  onClick={startDiagnostic}
                  disabled={loading}
                  className="w-full bg-[#15803D] hover:bg-[#22C55E] text-white font-semibold py-6 rounded-xl transition-colors"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start Diagnostic <ArrowRight className="w-4 h-4 ml-2 inline" /></>}
                </Button>

                <button
                  onClick={onSkip}
                  className="w-full text-center text-white/40 text-sm hover:text-white/60 transition-colors"
                >
                  Skip for now
                </button>
              </motion.div>
            )}

            {/* ── Quiz ── */}
            {phase === "quiz" && currentQuestion && (
              <motion.div
                key={`diag-${currentIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-2">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < currentIndex ? "bg-[#4ADE80]" : i === currentIndex ? "bg-[#15803D]" : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                <div className="text-center">
                  <span className="text-white/50 text-sm">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-white/30 text-xs ml-2">· {currentQuestion.topicTag.replace(/-/g, ' ')}</span>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
                  <p className="text-white font-medium text-lg" style={{ fontFamily: "Poppins" }}>
                    {currentQuestion.question}
                  </p>

                  <div className="space-y-2">
                    {currentQuestion.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                          selectedOption === i
                            ? "bg-[#15803D]/30 border-[#4ADE80] text-white"
                            : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <span className="text-[#4ADE80] font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleNext}
                  disabled={selectedOption === null || submitting}
                  className="w-full bg-[#15803D] hover:bg-[#22C55E] text-white font-semibold py-6 rounded-xl transition-colors disabled:opacity-40"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : currentIndex < questions.length - 1 ? (
                    <>Next <ArrowRight className="w-4 h-4 ml-2 inline" /></>
                  ) : (
                    <>See My Readiness <ArrowRight className="w-4 h-4 ml-2 inline" /></>
                  )}
                </Button>
              </motion.div>
            )}

            {/* ── Results ── */}
            {phase === "results" && (
              <motion.div
                key="diag-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#15803D]/20 mb-2"
                  >
                    <TrendingUp className="w-12 h-12 text-[#4ADE80]" />
                  </motion.div>
                  <p className="text-white/60 text-sm">Your starting readiness</p>
                  <h1 className="text-white text-5xl font-bold" style={{ fontFamily: "Poppins" }}>
                    {readinessScore}%
                  </h1>
                  <p className="text-white/50 text-sm">
                    {readinessScore >= 65 ? "You're close to test-ready. Let's push to 100%." : readinessScore >= 40 ? "Good foundation. We'll focus on your weak spots." : "Plenty of room to grow. The plan will get you there."}
                  </p>
                </div>

                {/* Topic breakdown */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
                  <p className="text-white/70 text-sm font-semibold">Topic breakdown</p>
                  {topicMastery.map((t) => (
                    <div key={t.topicTag} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-xs capitalize">{t.topicTag.replace(/-/g, ' ')}</span>
                        <span className="text-white/40 text-xs">{Math.round(t.mastery * 100)}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${t.mastery * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            t.mastery >= 0.7 ? "bg-[#4ADE80]" : t.mastery >= 0.4 ? "bg-yellow-400" : "bg-red-400"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => onComplete(readinessScore)}
                  className="w-full bg-[#15803D] hover:bg-[#22C55E] text-white font-semibold py-6 rounded-xl transition-colors"
                >
                  Start Learning <ArrowRight className="w-4 h-4 ml-2 inline" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
