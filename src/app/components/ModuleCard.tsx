import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Lock, Trophy } from "lucide-react";
import { motion } from "motion/react";

interface ModuleCardProps {
  title: string;
  icon: React.ReactNode;
  progress: number;
  xpReward: number;
  estimatedTime: string;
  isLocked?: boolean;
  isPremium?: boolean;
  onClick?: () => void;
}

export function ModuleCard({
  title,
  icon,
  progress,
  xpReward,
  estimatedTime,
  isLocked = false,
  isPremium = false,
  onClick
}: ModuleCardProps) {
  return (
    <motion.div
      whileHover={{ scale: isLocked ? 1 : 1.02, y: isLocked ? 0 : -2 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card
        className={`p-5 cursor-pointer transition-all border-2 border-transparent hover:shadow-lg ${
          isLocked ? "opacity-60" : "hover:border-primary/20"
        }`}
        onClick={!isLocked ? onClick : undefined}
      >
        <div className="flex items-start justify-between mb-4">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className={`p-4 rounded-2xl ${
              isLocked 
                ? "bg-muted/50 text-muted-foreground" 
                : "bg-gradient-to-br from-primary/20 to-primary/10 text-primary"
            }`}
          >
            {icon}
          </motion.div>
          {isLocked && <Lock className="w-5 h-5 text-muted-foreground" />}
          {isPremium && !isLocked && (
            <Badge className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground font-medium">
              Premium
            </Badge>
          )}
        </div>

        <h3 className="mb-3 line-clamp-2 font-semibold">{title}</h3>

        <div className="space-y-2.5 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-medium">Progress</span>
            <span className="text-sm font-semibold text-primary">
              {progress}%
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="flex items-center gap-1.5 text-accent-foreground"
          >
            <Trophy className="w-4 h-4" />
            <span className="font-medium">{xpReward} XP</span>
          </motion.div>
          <span className="text-muted-foreground">{estimatedTime}</span>
        </div>
      </Card>
    </motion.div>
  );
}
