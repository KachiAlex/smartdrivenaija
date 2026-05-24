import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, ArrowRight, Trophy, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { useApp } from "../context/AppContext";
import type { Question, QuizAnswer } from "../lib/api";

interface QuizScreenProps {
  onNavigate: (screen: string) => void;
  moduleId?: number | null;
}

export function QuizScreen({ onNavigate, moduleId }: QuizScreenProps) {
  const { currentModuleContent, submitQuiz, lastQuizResult } = useApp();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const answers = useRef<QuizAnswer[]>([]);
  const questionStartTime = useRef(Date.now());

  useEffect(() => {
    // Use questions from loaded module content, or empty
    if (currentModuleContent?.questions) {
      // Take up to 10 random questions for a quiz
      const shuffled = [...currentModuleContent.questions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled.slice(0, Math.min(10, shuffled.length)));
    }
  }, [currentModuleContent]);

  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentQuestion]);

  if (questions.length === 0) {
    return (
      <div className="size-full flex items-center justify-center bg-[#FAFBFF] relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-[#E63946]/10 blur-[100px]"
        />
        <Loader2 className="w-10 h-10 text-[#E63946] animate-spin relative z-10" />
      </div>
    );
  }

  const handleAnswer = (answerIndex: number) => {
    if (showFeedback) return;

    setSelectedAnswer(answerIndex);
    setShowFeedback(true);

    const q = questions[currentQuestion];
    const isCorrect = answerIndex === q.correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }

    answers.current.push({
      questionId: q.id,
      selected: answerIndex,
      timeMs: Date.now() - questionStartTime.current,
    });
  };

  const nextQuestion = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Submit quiz to API
      setIsSubmitting(true);
      try {
        if (moduleId) {
          await submitQuiz(moduleId, answers.current);
        }
      } catch {
        // Continue even on error
      }
      setIsSubmitting(false);
      setQuizComplete(true);

      if (score >= questions.length * 0.7) {
        confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } });
      }
    }
  };

  if (quizComplete) {
    const result = lastQuizResult;
    const percentage = result?.percentage || Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;
    const xpEarned = result?.xpEarned || 0;

    return (
      <div className="size-full flex flex-col items-center justify-center bg-[#FAFBFF] p-6 relative overflow-hidden">
        {/* Cosmic mesh blobs */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#E63946]/20 blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-[#F59E0B]/15 blur-[70px]"
        />

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`p-8 rounded-full mb-6 relative z-10 glow-pulse ${passed ? "bg-gradient-to-br from-[#E63946]/20 to-[#F4A261]/10" : "bg-[#E2E8F0]/50"}`}
        >
          <Trophy className={`w-20 h-20 ${passed ? "text-[#E63946]" : "text-[#64748B]"}`} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8 relative z-10"
        >
          <h2 className="mb-2 text-[#0F172A]" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
            {passed ? "Great Job!" : "Keep Practicing"}
          </h2>
          <p className="text-[#64748B] text-lg mb-4">
            You scored {score} out of {questions.length}
          </p>
          <div className="text-6xl mb-2" style={{ fontWeight: 800, fontFamily: "Poppins", color: passed ? "#3616F1" : "#64748B" }}>
            {percentage}%
          </div>
          {xpEarned > 0 && (
            <div className="flex items-center justify-center gap-2 text-[#F59E0B]">
              <Trophy className="w-5 h-5" />
              <span style={{ fontWeight: 600, fontFamily: "Poppins" }}>+{xpEarned} XP Earned</span>
            </div>
          )}
        </motion.div>

        <div className="w-full max-w-md space-y-3 relative z-10">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => onNavigate("home")} className="w-full h-12 shadow-lg shadow-[#E63946]/20" size="lg"
              style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
            >
              Back to Home
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="size-full flex flex-col bg-[#FAFBFF] relative overflow-hidden">
      {/* Cosmic mesh blobs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-15%] w-72 h-72 rounded-full bg-[#E63946]/15 blur-[90px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], x: [0, -15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] left-[-10%] w-60 h-60 rounded-full bg-[#F4A261]/10 blur-[80px]"
      />

      {/* Glass header */}
      <div className="p-6 relative z-10">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>
              Question {currentQuestion + 1}/{questions.length}
            </span>
            <span className="text-sm text-[#64748B]">
              Score: {score}/{questions.length}
            </span>
          </div>
          <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-[#E63946] to-[#F4A261] rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex flex-col"
          >
            <h3 className="mb-8 text-[#0F172A]" style={{ fontSize: "1.25rem", fontWeight: 600, fontFamily: "Poppins" }}>
              {question.question}
            </h3>

            <div className="space-y-3 flex-1">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === question.correctAnswer;
                const showAsCorrect = showFeedback && isCorrectAnswer;
                const showAsWrong = showFeedback && isSelected && !isCorrect;

                return (
                  <motion.div
                    key={index}
                    whileHover={!showFeedback ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!showFeedback ? { scale: 0.98 } : {}}
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all border-2 ${
                        showAsCorrect
                          ? "border-[#E63946] bg-[#E63946]/10 shadow-lg shadow-[#E63946]/20"
                          : showAsWrong
                          ? "border-red-400 bg-red-50"
                          : isSelected
                          ? "border-[#E63946] bg-[#E63946]/5"
                          : "border-[#E2E8F0] bg-white hover:border-[#E63946]/30 hover:shadow-md"
                      }`}
                      onClick={() => handleAnswer(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            showAsCorrect
                              ? "bg-[#E63946] text-white"
                              : showAsWrong
                              ? "bg-red-400 text-white"
                              : isSelected
                              ? "bg-[#E63946] text-white"
                              : "bg-[#E2E8F0] text-[#64748B]"
                          }`}
                          style={{ fontWeight: 600, fontFamily: "Poppins" }}
                        >
                          {showFeedback && (showAsCorrect || showAsWrong) ? (
                            showAsCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
                        </div>
                        <span className="text-[#0F172A]">{option}</span>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className={`p-4 glass-card border-2 ${isCorrect ? "border-[#E63946]/30" : "border-red-400/30"}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isCorrect ? "bg-[#E63946]/20" : "bg-red-100"}`}>
                  {isCorrect ? <Check className="w-6 h-6 text-[#E63946]" /> : <X className="w-6 h-6 text-red-400" />}
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-[#0F172A] font-semibold">{isCorrect ? "Correct!" : "Not quite"}</h4>
                  <p className="text-sm text-[#64748B]">
                    {isCorrect
                      ? "Well done! You got it right."
                      : `The correct answer is: ${question.options[question.correctAnswer!]}`}
                  </p>
                </div>
              </div>
            </Card>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={nextQuestion} className="w-full h-12 mt-4 shadow-lg shadow-[#E63946]/20" size="lg" disabled={isSubmitting}
                style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
                ) : currentQuestion < questions.length - 1 ? (
                  <>Next Question <ArrowRight className="w-5 h-5 ml-2" /></>
                ) : (
                  "See Results"
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
