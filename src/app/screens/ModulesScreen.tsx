import { useEffect } from "react";
import { motion } from "motion/react";
import { ModuleCard } from "../components/ModuleCard";
import { SignpostBig, ShieldCheck, Car, Wrench, AlertTriangle, Heart, Wine, FileCheck } from "lucide-react";
import { useApp } from "../context/AppContext";

interface ModulesScreenProps {
  onNavigate: (screen: string, data?: { moduleId?: number }) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  SignpostBig: <SignpostBig className="w-8 h-8" />,
  ShieldCheck: <ShieldCheck className="w-8 h-8" />,
  Car: <Car className="w-8 h-8" />,
  Wrench: <Wrench className="w-8 h-8" />,
  AlertTriangle: <AlertTriangle className="w-8 h-8" />,
  Heart: <Heart className="w-8 h-8" />,
  Wine: <Wine className="w-8 h-8" />,
  FileCheck: <FileCheck className="w-8 h-8" />,
};

export function ModulesScreen({ onNavigate }: ModulesScreenProps) {
  const { modules, loadModules } = useApp();

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const handleModuleClick = (mod: typeof modules[0]) => {
    if (mod.isLocked) return;
    if (mod.slug === 'mock-test') {
      onNavigate("mock-test");
    } else {
      onNavigate("lesson", { moduleId: mod.id });
    }
  };

  return (
    <div className="size-full overflow-auto bg-background pb-24">
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2" style={{ fontSize: "1.75rem" }}>
            Learning Modules
          </h1>
          <p className="text-muted-foreground">
            Complete all modules to master Nigerian driving
          </p>
        </motion.div>
      </div>

      <div className="p-6 space-y-4">
        {modules.map((mod, index) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ModuleCard
              title={mod.title}
              icon={iconMap[mod.icon] || <SignpostBig className="w-8 h-8" />}
              progress={mod.progressPercent}
              xpReward={mod.xpReward}
              estimatedTime={`${mod.estimatedMinutes} min`}
              isLocked={mod.isLocked}
              isPremium={mod.isPremium}
              onClick={() => handleModuleClick(mod)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
