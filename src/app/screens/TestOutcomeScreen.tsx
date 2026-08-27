import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { motion } from "motion/react";
import {
  ArrowLeft, CheckCircle2, XCircle, TrendingUp, Target,
  Loader2, PartyPopper, BookOpen, Calendar,
} from "lucide-react";
import { api, type RetakePlanItem } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface TestOutcomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function TestOutcomeScreen({ onNavigate }: TestOutcomeScreenProps) {
  const { user, setTestOutcome } = useAuth();
  const [outcome, setOutcome] = useState<"passed" | "failed" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retakePlan, setRetakePlan] = useState<RetakePlanItem[]>([]);
  const [result, setResult] = useState<"passed" | "failed" | null>(null);

  const handleSubmit = async (selected: "passed" | "failed") => {
    setSubmitting(true);
    try {
      const res = await api.submitTestOutcome(selected);
      setResult(selected);
      setRetakePlan(res.retakePlan || []);
      setTestOutcome(selected);

      if (selected === "passed") {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#15803D", "#22C55E", "#BBF7D0", "#F59E0B"],
        });
      }
    } catch {
      toast.error("Failed to submit result");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Result screen ────────────────────────────────────────────
  if (result === "passed") {
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="relative z-10 text-center pt-4"
          >
            <PartyPopper className="w-16 h-16 mx-auto mb-4 text-white" />
            <h1 className="text-white mb-2" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
              Congratulations!
            </h1>
            <p className="text-white/80 text-lg">You passed your theory test</p>
          </motion.div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 glass-card border-[#22C55E]/10">
              <h3 className="text-[#14532D] font-bold mb-3" style={{ fontFamily: "Poppins" }}>
                Your licence journey continues here
              </h3>
              <p className="text-[#4B7C5F] leading-relaxed mb-4">
                You have mastered the theory. SmartDrive Naija stays with you beyond the test:
              </p>
              <div className="space-y-3">
                {[
                  { icon: BookOpen, text: "Daily road sense items to keep your knowledge sharp" },
                  { icon: Target, text: "Refresher prompts before your licence renewal" },
                  { icon: TrendingUp, text: "Advanced driving tips and hazard awareness" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#15803D]/10 flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#15803D]" />
                      </div>
                      <p className="text-[#4B7C5F] text-sm leading-relaxed pt-1">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="p-6 border-t border-[#BBF7D0] bg-white">
          <Button
            onClick={() => onNavigate("home")}
            className="w-full h-12 text-white"
            size="lg"
            style={{ background: "linear-gradient(135deg, #15803D, #22C55E)" }}
          >
            Continue to Home
          </Button>
        </div>
      </div>
    );
  }

  // ── Failed: retake plan ──────────────────────────────────────
  if (result === "failed") {
    return (
      <div className="size-full flex flex-col bg-[#F0FDF4]">
        <div className="relative p-6 pb-8 rounded-b-[2.5rem] overflow-hidden text-white"
          style={{ background: "linear-gradient(135deg, #B45309 0%, #F59E0B 40%, #451A03 100%)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#F59E0B]/30 blur-[80px]"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 pt-4"
          >
            <h1 className="text-white mb-2" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
              We will get you there
            </h1>
            <p className="text-white/80 text-lg">A targeted plan from your weakest topics</p>
          </motion.div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 glass-card border-[#F59E0B]/10">
              <p className="text-[#4B7C5F] leading-relaxed mb-4">
                You did not pass this time, but you are closer than you think. We have analysed your performance and built a plan that targets exactly where you lost marks.
              </p>
              <div className="space-y-3">
                {retakePlan.map((item, i) => {
                  const pct = Math.round(item.mastery * 100);
                  return (
                    <motion.div
                      key={item.topicTag}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#14532D] font-medium text-sm capitalize">{item.topicTag.replace(/-/g, " ")}</span>
                        <span className="text-[#B45309] font-bold text-sm">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#BBF7D0] overflow-hidden">
                        <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[#4B7C5F] text-xs mt-1">{item.questionsToFocus} questions to focus on</p>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-4 glass-card border-[#22C55E]/10 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#15803D] flex-shrink-0" />
              <p className="text-[#4B7C5F] text-sm">
                Your plan starts tomorrow. Each session will prioritise your weak topics first.
              </p>
            </Card>
          </motion.div>
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

  // ── Selection screen ─────────────────────────────────────────
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
          <h1 className="text-white mb-2" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
            How did it go?
          </h1>
          <p className="text-white/80 text-lg">Your test date has passed. Let us know your result.</p>
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md space-y-4"
        >
          <p className="text-center text-[#4B7C5F] mb-6">
            This helps us improve the app and build the right plan for you.
          </p>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSubmit("passed")}
            disabled={submitting}
            className="w-full p-6 rounded-2xl border-2 border-[#22C55E] bg-[#22C55E]/5 hover:bg-[#22C55E]/10 transition-all"
          >
            <CheckCircle2 className="w-12 h-12 text-[#22C55E] mx-auto mb-3" />
            <h3 className="text-[#14532D] font-bold text-xl mb-1" style={{ fontFamily: "Poppins" }}>I Passed</h3>
            <p className="text-[#4B7C5F] text-sm">Celebrate and continue your journey</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSubmit("failed")}
            disabled={submitting}
            className="w-full p-6 rounded-2xl border-2 border-[#F59E0B] bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10 transition-all"
          >
            <XCircle className="w-12 h-12 text-[#F59E0B] mx-auto mb-3" />
            <h3 className="text-[#14532D] font-bold text-xl mb-1" style={{ fontFamily: "Poppins" }}>I Did Not Pass</h3>
            <p className="text-[#4B7C5F] text-sm">Get a targeted retake plan</p>
          </motion.button>

          {submitting && (
            <div className="flex items-center justify-center gap-2 text-[#4B7C5F]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
