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
      <div className="size-full flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
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
      <div className="size-full flex flex-col items-center justify-center bg-background p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`p-8 rounded-full mb-6 ${passed ? "bg-primary/10" : "bg-muted"}`}
        >
          <Trophy className={`w-20 h-20 ${passed ? "text-primary" : "text-muted-foreground"}`} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="mb-2" style={{ fontSize: "2rem" }}>
            {passed ? "Great Job!" : "Keep Practicing"}
          </h2>
          <p className="text-muted-foreground text-lg mb-4">
            You scored {score} out of {questions.length}
          </p>
          <div className="text-6xl font-heading mb-2" style={{ fontWeight: 800, color: passed ? "var(--primary)" : "var(--muted-foreground)" }}>
            {percentage}%
          </div>
          {xpEarned > 0 && (
            <div className="flex items-center justify-center gap-2 text-accent-foreground">
              <Trophy className="w-5 h-5" />
              <span className="font-heading" style={{ fontWeight: 600 }}>+{xpEarned} XP Earned</span>
            </div>
          )}
        </motion.div>

        <div className="w-full max-w-md space-y-3">
          <Button onClick={() => onNavigate("home")} className="w-full h-12" size="lg">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="size-full flex flex-col bg-background">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <span className="font-heading" style={{ fontWeight: 600 }}>
            Question {currentQuestion + 1}/{questions.length}
          </span>
          <span className="text-sm text-muted-foreground">
            Score: {score}/{questions.length}
          </span>
        </div>
        <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
      </div>

      <div className="flex-1 flex flex-col p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="flex-1 flex flex-col"
          >
            <h3 className="mb-8" style={{ fontSize: "1.25rem" }}>
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
                    whileHover={!showFeedback ? { scale: 1.02 } : {}}
                    whileTap={!showFeedback ? { scale: 0.98 } : {}}
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all ${
                        showAsCorrect
                          ? "border-primary bg-primary/10"
                          : showAsWrong
                          ? "border-destructive bg-destructive/10"
                          : isSelected
                          ? "border-primary"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => handleAnswer(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-heading ${
                            showAsCorrect
                              ? "bg-primary text-white"
                              : showAsWrong
                              ? "bg-destructive text-white"
                              : isSelected
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {showFeedback && (showAsCorrect || showAsWrong) ? (
                            showAsCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />
                          ) : (
                            String.fromCharCode(65 + index)
                          )}
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

        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className={`p-4 ${isCorrect ? "bg-primary/10 border-primary/20" : "bg-destructive/10 border-destructive/20"}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isCorrect ? "bg-primary/20" : "bg-destructive/20"}`}>
                  {isCorrect ? <Check className="w-6 h-6 text-primary" /> : <X className="w-6 h-6 text-destructive" />}
                </div>
                <div className="flex-1">
                  <h4 className="mb-1">{isCorrect ? "Correct!" : "Not quite"}</h4>
                  <p className="text-sm text-muted-foreground">
                    {isCorrect
                      ? "Well done! You got it right."
                      : `The correct answer is: ${question.options[question.correctAnswer!]}`}
                  </p>
                </div>
              </div>
            </Card>

            <Button onClick={nextQuestion} className="w-full h-12 mt-4" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
              ) : currentQuestion < questions.length - 1 ? (
                <>Next Question <ArrowRight className="w-5 h-5 ml-2" /></>
              ) : (
                "See Results"
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
