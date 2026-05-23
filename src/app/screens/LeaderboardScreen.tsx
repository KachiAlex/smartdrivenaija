import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { motion } from "motion/react";
import { Trophy, Medal, Award, TrendingUp, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";

export function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<"weekly" | "alltime">("weekly");
  const { leaderboard, loadLeaderboard, loading } = useApp();

  useEffect(() => {
    loadLeaderboard(activeTab);
  }, [activeTab, loadLeaderboard]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-accent" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-heading" style={{ fontWeight: 600 }}>#{rank}</span>;
    }
  };

  const data = leaderboard?.leaderboard || [];
  const currentUserRank = leaderboard?.currentUserRank;

  return (
    <div className="size-full flex flex-col bg-[#FAFBFF] pb-28">
      <div className="relative p-6 pb-6 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #F59E0B20 0%, #6366F120 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2 text-[#0F172A]" style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "Poppins" }}>
            Leaderboard
          </h1>
          <p className="text-[#64748B]">
            Compete with learners across Nigeria
          </p>
        </motion.div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "weekly" | "alltime")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#E2E8F0]/50">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {loading.leaderboard ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
              </div>
            ) : data.length === 0 ? (
              <p className="text-center text-[#64748B] py-8">No leaderboard data yet</p>
            ) : (
              data.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`p-4 glass-card ${user.isCurrentUser ? "border-[#6366F1] bg-[#6366F1]/5" : ""}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10">
                        {getRankIcon(user.rank)}
                      </div>

                      <Avatar className={`${user.rank <= 3 ? "w-12 h-12" : "w-10 h-10"}`}>
                        <AvatarFallback className={user.rank === 1 ? "bg-[#F59E0B] text-white" : user.rank === 2 ? "bg-[#E2E8F0]" : user.rank === 3 ? "bg-amber-100" : ""}>
                          {user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>{user.name}</p>
                          {user.isCurrentUser && <Badge variant="secondary" className="text-xs bg-[#6366F1]/10 text-[#6366F1]">You</Badge>}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-[#D97706] mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-bold" style={{ fontFamily: "Poppins" }}>{user.xp}</span>
                        </div>
                        <p className="text-xs text-[#64748B] flex items-center gap-1">
                          <span>🔥</span> {user.streak} days
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}

            {currentUserRank && currentUserRank > data.length && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <Card className="p-4 glass-card border-[#6366F1] bg-[#6366F1]/5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10">
                      <span className="text-[#64748B] font-semibold" style={{ fontFamily: "Poppins" }}>#{currentUserRank}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#0F172A]" style={{ fontFamily: "Poppins" }}>Your Rank</p>
                        <Badge variant="secondary" className="text-xs bg-[#6366F1]/10 text-[#6366F1]">You</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
