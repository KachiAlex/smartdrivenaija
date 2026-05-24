import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { motion } from "motion/react";
import { Trophy, TrendingUp, AlertCircle, CheckCircle, Share2, MessageCircle } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useApp } from "../context/AppContext";

interface ResultsScreenProps {
  onNavigate: (screen: string) => void;
}

export function ResultsScreen({ onNavigate }: ResultsScreenProps) {
  const { lastMockResult, lastQuizResult } = useApp();

  // Use mock test result first, then quiz result as fallback
  const result = lastMockResult || lastQuizResult;
  const totalScore = result?.percentage || 0;
  const passed = totalScore >= 70;
  const score = result?.score || 0;
  const totalQuestions = result?.totalQuestions || 0;
  const wrong = totalQuestions - score;
  const xpEarned = result?.xpEarned || 0;

  const handleWhatsAppShare = () => {
    const message = passed
      ? `🎉 I just scored ${totalScore}% on my SmartDrive Naija mock test! ${score}/${totalQuestions} correct. I'm ready for my driving test! 🚗 #SmartDriveNaija`
      : `📚 I scored ${totalScore}% on my SmartDrive Naija mock test. ${score}/${totalQuestions} correct. Still practicing for my driving test! 🚗 #SmartDriveNaija`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Topic performance from mock test
  const topicPerformance = ('topicPerformance' in (result || {}))
    ? (result as any).topicPerformance?.map((t: any) => ({ topic: t.topic.replace(/_/g, ' '), score: t.percentage })) || []
    : [];

  const weakAreas = ('weakAreas' in (result || {}))
    ? (result as any).weakAreas || []
    : [];

  return (
    <div className="size-full overflow-auto bg-[#FAFBFF] pb-28">
      {/* Cosmic header with mesh gradient */}
      <div className="relative p-6 pb-12 rounded-b-[2.5rem] overflow-hidden"
        style={{ background: passed ? "linear-gradient(135deg, #E63946 0%, #F4A261 40%, #0A1628 100%)" : "linear-gradient(135deg, #64748B 0%, #94A3B8 100%)" }}
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
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6 relative z-10"
        >
          <div className={`p-8 rounded-full glow-pulse ${passed ? "bg-white/20" : "bg-white/10"}`}>
            <Trophy className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center relative z-10"
        >
          <h1 className="text-white mb-2" style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Poppins" }}>
            {passed ? "Congratulations!" : "Keep Practicing"}
          </h1>
          <p className="text-white/80 text-lg mb-4">
            {passed ? "You passed the mock test!" : "You didn't pass this time"}
          </p>
          <motion.div
            className="shimmer-text text-7xl mb-2"
            style={{ fontWeight: 800, fontFamily: "Poppins" }}
          >
            {totalScore}%
          </motion.div>
          <Badge className={passed ? "bg-white/20 text-white border-white/30" : "bg-white/10 text-white/70 border-white/20"}>
            {passed ? "PASSED" : "FAILED"} • Pass mark: 70%
          </Badge>
        </motion.div>
      </div>

      <div className="p-6 space-y-6 -mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4 text-[#0F172A] font-bold">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 glass-card border-[#E63946]/10">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-[#E63946]" />
                <span className="text-sm text-[#64748B]">Correct</span>
              </div>
              <p className="text-[#0F172A]" style={{ fontWeight: 700, fontSize: "1.5rem", fontFamily: "Poppins" }}>
                {score}/{totalQuestions}
              </p>
            </Card>

            <Card className="p-4 glass-card border-red-400/10">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-sm text-[#64748B]">Wrong</span>
              </div>
              <p className="text-[#0F172A]" style={{ fontWeight: 700, fontSize: "1.5rem", fontFamily: "Poppins" }}>
                {wrong}/{totalQuestions}
              </p>
            </Card>
          </div>

          {xpEarned > 0 && (
            <Card className="p-4 mt-3 glass-card border-[#F59E0B]/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#64748B]">XP Earned</span>
                <span className="text-[#F59E0B]" style={{ fontWeight: 700, fontSize: "1.5rem", fontFamily: "Poppins" }}>+{xpEarned}</span>
              </div>
            </Card>
          )}
        </motion.div>

        {topicPerformance.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="mb-4 text-[#0F172A] font-bold">Topic Performance</h3>
            <Card className="p-6 glass-card border-[#E63946]/10">
              <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicPerformance}>
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="score" fill="#E63946" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </Card>
          </motion.div>
        )}

        {weakAreas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="mb-4 text-[#0F172A] font-bold">Weak Areas</h3>
            <Card className="p-4 space-y-4 glass-card border-[#E63946]/10">
              {weakAreas.map((area: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#0F172A]">{area.topic.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-[#64748B]">{area.percentage}%</span>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${area.percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#E63946] to-[#F4A261] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="mb-4 text-[#0F172A] font-bold">Recommended Next Steps</h3>
          <Card className="p-4 glass-card border-[#F59E0B]/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#F59E0B]/20">
                <TrendingUp className="w-6 h-6 text-[#D97706]" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1 text-[#0F172A] font-semibold">Review Safety Module</h4>
                <p className="text-sm text-[#64748B] mb-3">
                  Focus on First Aid & Accident Response to improve your score
                </p>
                <Button variant="outline" size="sm" onClick={() => onNavigate("modules")} className="border-[#E63946]/30 text-[#E63946]">
                  Go to Module
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3 pt-4"
        >
          {passed && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => onNavigate("certificate")} className="w-full h-12 shadow-lg shadow-[#E63946]/20" size="lg"
                style={{ background: "linear-gradient(135deg, #1D3557, #0A1628)" }}
              >
                View Certificate
              </Button>
            </motion.div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleWhatsAppShare} variant="outline" className="h-12 border-[#E63946]/30 text-[#E63946]">
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={() => onNavigate("home")} variant="outline" className="h-12 border-[#E63946]/30 text-[#E63946]">
              Home
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
