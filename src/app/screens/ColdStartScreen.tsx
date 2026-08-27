import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Loader2, Calendar, CheckCircle2, XCircle, ArrowRight, Sparkles, Car } from "lucide-react";
import { api, type ColdStartQuestion, type ColdStartResult } from "../lib/api";

interface ColdStartScreenProps {
  onComplete: (testDate: string | null, alreadyLicensed: boolean) => void;
}

type Phase = "test-date" | "quiz" | "results";

export function ColdStartScreen({ onComplete }: ColdStartScreenProps) {
  const [phase, setPhase] = useState<Phase>("test-date");

  // Test date state
  const [testDate, setTestDate] = useState("");
  const [alreadyLicensed, setAlreadyLicensed] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState<ColdStartQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; selected: number }[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Results state
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ColdStartResult[]>([]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getColdStartQuestions();
      setQuestions(data.questions);
    } catch (err) {
      console.error("Failed to load cold-start questions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTestDateNext = () => {
    if (alreadyLicensed || testDate) {
      fetchQuestions();
      setPhase("quiz");
    }
  };

  const handleAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null) return;

    const newAnswers = [...answers, { questionId: questions[currentIndex].id, selected: selectedOption }];
    setAnswers(newAnswers);
    setSelectedOption(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitAnswers(newAnswers);
    }
  };

  const submitAnswers = async (allAnswers: { questionId: number; selected: number }[]) => {
    setLoading(true);
    try {
      const data = await api.checkColdStartAnswers(allAnswers);
      setScore(data.score);
      setResults(data.results);
      setPhase("results");
    } catch (err) {
      console.error("Failed to check answers:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A1F12] overflow-y-auto">
      {/* Background glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] right-[5%] w-72 h-72 rounded-full bg-[#15803D]/20 blur-[80px] pointer-events-none"
      />

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* ── Phase 1: Test date question ── */}
            {phase === "test-date" && (
              <motion.div
                key="test-date"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#15803D]/20 mb-2">
                    <Car className="w-8 h-8 text-[#4ADE80]" />
                  </div>
                  <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Poppins" }}>
                    SmartDrive Naija
                  </h1>
                  <p className="text-white/70 text-sm">
                    Let's personalize your study plan. One question first.
                  </p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 space-y-4">
                  <div className="flex items-center gap-2 text-[#4ADE80]">
                    <Calendar className="w-5 h-5" />
                    <span className="font-semibold text-white">When is your driving test?</span>
                  </div>

                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => { setTestDate(e.target.value); setAlreadyLicensed(false); }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#4ADE80] transition-colors"
                  />

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-white/40 text-xs">OR</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <button
                    onClick={() => { setAlreadyLicensed(true); setTestDate(""); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      alreadyLicensed
                        ? "bg-[#15803D]/30 border-[#4ADE80] text-white"
                        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    I already have my licence
                  </button>

                  <button
                    onClick={() => { setTestDate(""); setAlreadyLicensed(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      !testDate && !alreadyLicensed
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    Not booked yet
                  </button>
                </div>

                <Button
                  onClick={handleTestDateNext}
                  className="w-full bg-[#15803D] hover:bg-[#22C55E] text-white font-semibold py-6 rounded-xl transition-colors"
                >
                  Start <ArrowRight className="w-4 h-4 ml-2 inline" />
                </Button>
              </motion.div>
            )}

            {/* ── Phase 2: Quiz ── */}
            {phase === "quiz" && currentQuestion && (
              <motion.div
                key={`quiz-${currentIndex}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                {/* Progress bar */}
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
                  onClick={handleNextQuestion}
                  disabled={selectedOption === null || loading}
                  className="w-full bg-[#15803D] hover:bg-[#22C55E] text-white font-semibold py-6 rounded-xl transition-colors disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : currentIndex < questions.length - 1 ? (
                    <>Next <ArrowRight className="w-4 h-4 ml-2 inline" /></>
                  ) : (
                    <>See Results <ArrowRight className="w-4 h-4 ml-2 inline" /></>
                  )}
                </Button>
              </motion.div>
            )}

            {/* ── Phase 3: Results ── */}
            {phase === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#15803D]/20 mb-2"
                  >
                    <Sparkles className="w-10 h-10 text-[#4ADE80]" />
                  </motion.div>
                  <h1 className="text-white text-3xl font-bold" style={{ fontFamily: "Poppins" }}>
                    You got {score} of {questions.length}
                  </h1>
                  <p className="text-white/60 text-sm">
                    {score >= 4 ? "Great start! You're already ahead." : score >= 2 ? "You've got the basics — let's build from here." : "Don't worry, we'll get you there. That's what the plan is for."}
                  </p>
                </div>

                {/* Answer breakdown */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 space-y-3">
                  <p className="text-white/70 text-sm font-semibold">Here's what a full plan looks like:</p>
                  {results.map((r, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {r.correct ? (
                        <CheckCircle2 className="w-5 h-5 text-[#4ADE80] flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-xs">
                          {r.topicTag.replace(/-/g, ' ')}
                        </p>
                        <p className="text-white/50 text-xs mt-0.5">{r.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#15803D]/10 backdrop-blur-xl rounded-2xl p-5 border border-[#4ADE80]/20">
                  <p className="text-white text-sm">
                    Create a free account to save your progress, get a personalized study plan, and track your readiness for test day.
                  </p>
                </div>

                <Button
                  onClick={() => onComplete(testDate || null, alreadyLicensed)}
                  className="w-full bg-[#15803D] hover:bg-[#22C55E] text-white font-semibold py-6 rounded-xl transition-colors"
                >
                  Create Account to Save Progress <ArrowRight className="w-4 h-4 ml-2 inline" />
                </Button>

                <button
                  onClick={() => onComplete(testDate || null, alreadyLicensed)}
                  className="w-full text-center text-white/40 text-sm hover:text-white/60 transition-colors"
                >
                  Skip for now
                </button>
              </motion.div>
            )}

            {/* Loading state */}
            {loading && phase === "quiz" && !currentQuestion && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#4ADE80] animate-spin" />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
