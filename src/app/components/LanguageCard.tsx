import { Card } from "./ui/card";
import { motion } from "motion/react";
import { Check } from "lucide-react";

interface LanguageCardProps {
  name: string;
  region: string;
  icon: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export function LanguageCard({
  name,
  region,
  icon,
  isSelected = false,
  onClick
}: LanguageCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card
        className={`p-6 cursor-pointer transition-all relative ${
          isSelected
            ? "border-primary border-2 bg-primary/5"
            : "border hover:border-primary/50"
        }`}
        onClick={onClick}
      >
        {isSelected && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        <div className="flex flex-col items-center text-center gap-3">
          <div className="text-4xl">{icon}</div>
          <div>
            <h3 className="mb-1">{name}</h3>
            <p className="text-sm text-muted-foreground">{region}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
