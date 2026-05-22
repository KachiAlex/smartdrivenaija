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
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card
        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
          isLocked ? "opacity-60" : ""
        }`}
        onClick={!isLocked ? onClick : undefined}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          {isLocked && <Lock className="w-5 h-5 text-muted-foreground" />}
          {isPremium && !isLocked && (
            <Badge variant="secondary" className="bg-accent text-accent-foreground">
              Premium
            </Badge>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2">{title}</h3>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-heading" style={{ fontWeight: 600 }}>
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-accent-foreground">
            <Trophy className="w-4 h-4" />
            <span>{xpReward} XP</span>
          </div>
          <span className="text-muted-foreground">{estimatedTime}</span>
        </div>
      </Card>
    </motion.div>
  );
}
