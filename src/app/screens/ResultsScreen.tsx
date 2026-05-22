import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { motion } from "motion/react";
import { Trophy, TrendingUp, AlertCircle, CheckCircle, Share2 } from "lucide-react";
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

  // Topic performance from mock test
  const topicPerformance = ('topicPerformance' in (result || {}))
    ? (result as any).topicPerformance?.map((t: any) => ({ topic: t.topic.replace(/_/g, ' '), score: t.percentage })) || []
    : [];

  const weakAreas = ('weakAreas' in (result || {}))
    ? (result as any).weakAreas || []
    : [];

  return (
    <div className="size-full overflow-auto bg-background pb-24">
      <div className={`bg-gradient-to-br ${passed ? "from-primary to-secondary" : "from-muted to-muted/50"} text-white p-6 pb-12`}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <div className={`p-8 rounded-full ${passed ? "bg-white/20" : "bg-white/10"}`}>
            <Trophy className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-white mb-2" style={{ fontSize: "2rem" }}>
            {passed ? "Congratulations!" : "Keep Practicing"}
          </h1>
          <p className="text-white/80 text-lg mb-4">
            {passed ? "You passed the mock test!" : "You didn't pass this time"}
          </p>
          <div className="text-7xl font-heading mb-2" style={{ fontWeight: 800 }}>
            {totalScore}%
          </div>
          <Badge className={passed ? "bg-white/20 text-white border-white/30" : "bg-white/10 text-white/70 border-white/20"}>
            {passed ? "PASSED" : "FAILED"} • Pass mark: 70%
          </Badge>
        </motion.div>
      </div>

      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Correct</span>
              </div>
              <p className="font-heading" style={{ fontWeight: 700, fontSize: "1.5rem" }}>
                {score}/{totalQuestions}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-muted-foreground">Wrong</span>
              </div>
              <p className="font-heading" style={{ fontWeight: 700, fontSize: "1.5rem" }}>
                {wrong}/{totalQuestions}
              </p>
            </Card>
          </div>

          {xpEarned > 0 && (
            <Card className="p-4 mt-3 bg-accent/10 border-accent/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">XP Earned</span>
                <span className="font-heading" style={{ fontWeight: 700, fontSize: "1.5rem" }}>+{xpEarned}</span>
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
            <h3 className="mb-4">Topic Performance</h3>
            <Card className="p-6">
              <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicPerformance}>
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="score" fill="var(--primary)" radius={[8, 8, 0, 0]} />
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
            <h3 className="mb-4">Weak Areas</h3>
            <Card className="p-4 space-y-4">
              {weakAreas.map((area: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span>{area.topic.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-muted-foreground">{area.percentage}%</span>
                  </div>
                  <Progress value={area.percentage} className="h-2" />
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
          <h3 className="mb-4">Recommended Next Steps</h3>
          <Card className="p-4 bg-accent/10 border-accent/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <TrendingUp className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h4 className="mb-1">Review Safety Module</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Focus on First Aid & Accident Response to improve your score
                </p>
                <Button variant="outline" size="sm" onClick={() => onNavigate("modules")}>
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
            <Button onClick={() => onNavigate("certificate")} className="w-full h-12" size="lg">
              View Certificate
            </Button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12">
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>
            <Button onClick={() => onNavigate("home")} variant="outline" className="h-12">
              Home
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
