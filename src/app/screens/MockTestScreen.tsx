import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Flag, ArrowRight, FileCheck, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import type { Question, QuizAnswer } from "../lib/api";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface MockTestScreenProps {
  onNavigate: (screen: string) => void;
}

export function MockTestScreen({ onNavigate }: MockTestScreenProps) {
  const { startMockTest, submitMockTest, currentMockTest, lastMockResult, loading, readinessScore, loadReadiness } = useApp();
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const testStartTime = useRef(Date.now());
  const questionStartTimes = useRef<number[]>([]);

  useEffect(() => {
    loadReadiness();
  }, [loadReadiness]);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || !currentMockTest) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted, currentMockTest]);

  const questions = currentMockTest?.questions || [];

  const handleStart = async () => {
    try {
      const test = await startMockTest();
      setAnswers(new Array(test.questions.length).fill(null));
      questionStartTimes.current = new Array(test.questions.length).fill(0);
      testStartTime.current = Date.now();
      setTimeRemaining(test.timeLimitSeconds);
      setHasStarted(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start mock test');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!currentMockTest || isSubmitting) return;
    setIsSubmitting(true);

    const timeTaken = Math.round((Date.now() - testStartTime.current) / 1000);
    const quizAnswers: QuizAnswer[] = answers.map((selected, i) => ({
      questionId: questions[i]?.id,
      selected: selected ?? -1,
      timeMs: questionStartTimes.current[i] || 0,
    })).filter(a => a.selected >= 0);

    try {
      await submitMockTest(currentMockTest.testId, quizAnswers, timeTaken);
      onNavigate("results");
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit test');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentMockTest, isSubmitting, answers, questions, submitMockTest, onNavigate]);

  // Keep a ref to handleSubmit so the timer always calls the latest version
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  if (!hasStarted) {
    const READINESS_THRESHOLD = 65;
    const isGated = readinessScore !== null && readinessScore < READINESS_THRESHOLD;

    if (isGated) {
      return (
        <div className="size-full flex flex-col items-center justify-center bg-[#F0FDF4] p-6 pb-28">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="p-8 rounded-full bg-[#15803D]/10 mb-6"
          >
            <Lock className="w-16 h-16 text-[#15803D]" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8 max-w-md"
          >
            <h1 className="mb-4 text-[#14532D]" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
              Not quite ready yet
            </h1>
            <p className="text-[#4B7C5F] text-lg leading-relaxed mb-4">
              Your readiness score is {readinessScore}%. We recommend reaching {READINESS_THRESHOLD}% before taking a full mock test.
            </p>
            <p className="text-[#4B7C5F] text-sm">
              Keep studying and you'll get there soon. Your first mock result matters — make it a good one!
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-md space-y-3"
          >
            <Button onClick={() => onNavigate("modules")} className="w-full h-12 shadow-lg shadow-[#15803D]/20" size="lg"
              style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
            >
              Continue Studying
            </Button>
            <Button onClick={() => onNavigate("home")} variant="outline" className="w-full h-12 border-[#15803D]/30 text-[#15803D]" size="lg">
              Back to Home
            </Button>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="size-full flex flex-col items-center justify-center bg-[#F0FDF4] p-6 pb-28">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="p-8 rounded-full bg-[#14532D]/10 mb-6"
        >
          <FileCheck className="w-20 h-20 text-[#14532D]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 max-w-md"
        >
          <h1 className="mb-4 text-[#14532D]" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
            Mock Theory Test
          </h1>
          <p className="text-[#4B7C5F] text-lg leading-relaxed mb-6">
            This is a practice test that simulates the actual FRSC driving theory exam.
          </p>

          <Card className="p-6 text-left space-y-4 glass-card border-[#22C55E]/10">
            <div className="flex items-center justify-between">
              <span className="text-[#4B7C5F]">Questions</span>
              <span className="font-semibold text-[#14532D]" style={{ fontFamily: "Poppins" }}>40</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4B7C5F]">Time Limit</span>
              <span className="font-semibold text-[#14532D]" style={{ fontFamily: "Poppins" }}>30 minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4B7C5F]">Pass Mark</span>
              <span className="font-semibold text-[#14532D]" style={{ fontFamily: "Poppins" }}>70%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4B7C5F]">Reward</span>
              <Badge className="bg-[#22C55E] text-[#14532D] border-0">+1000 XP</Badge>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-md space-y-3"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleStart} className="w-full h-12 shadow-lg shadow-[#15803D]/20" size="lg" disabled={loading.mockTest}
              style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
            >
              {loading.mockTest ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...</> : 'Start Test'}
            </Button>
          </motion.div>
          <Button onClick={() => onNavigate("home")} variant="outline" className="w-full h-12 border-[#15803D]/30 text-[#15803D]" size="lg">
            Back to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="size-full flex items-center justify-center bg-[#F0FDF4]">
        <Loader2 className="w-10 h-10 text-[#15803D] animate-spin" />
      </div>
    );
  }

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(currentQuestion)) {
      newFlagged.delete(currentQuestion);
    } else {
      newFlagged.add(currentQuestion);
    }
    setFlaggedQuestions(newFlagged);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1]);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
    }
  };

  const question = questions[currentQuestion];
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const answeredCount = answers.filter(a => a !== null).length;

  return (
    <div className="size-full flex flex-col bg-[#F0FDF4]">
      <div className="text-white p-6 pb-4" style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}>
        <div className="flex items-center justify-between mb-4">
          <Badge className="bg-white/20 text-white border-white/30">
            Mock Theory Test
          </Badge>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-heading" style={{ fontWeight: 700, color: timeRemaining < 300 ? '#ef4444' : 'inherit' }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Progress value={(answeredCount / questions.length) * 100} className="flex-1 h-2 bg-white/20" />
          <span className="text-sm font-heading" style={{ fontWeight: 600 }}>
            {answeredCount}/{questions.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3>Question {currentQuestion + 1}</h3>
          <button
            onClick={toggleFlag}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              flaggedQuestions.has(currentQuestion)
                ? "bg-[#14532D]/20 text-[#15803D]"
                : "bg-[#BBF7D0] text-[#4B7C5F] hover:bg-[#BBF7D0]/80"
            }`}
          >
            <Flag className={`w-4 h-4 ${flaggedQuestions.has(currentQuestion) ? "fill-current" : ""}`} />
            <span className="text-sm">Flag</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h4 className="text-lg leading-relaxed">
              {question.question}
            </h4>

            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;

                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all border-2 ${
                        isSelected
                          ? "border-[#15803D] bg-[#15803D]/10"
                          : "border-[#BBF7D0] hover:border-[#15803D]/50"
                      }`}
                      onClick={() => handleAnswer(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected
                              ? "bg-[#15803D] text-white"
                              : "bg-[#BBF7D0] text-[#4B7C5F]"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-[#BBF7D0] bg-[#F0FDF4] space-y-3">
        <div className="flex gap-3">
          <Button
            onClick={previousQuestion}
            variant="outline"
            className="flex-1 h-12"
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={nextQuestion} className="flex-1 h-12">
              Next
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 h-12" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</> : 'Submit Test'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
