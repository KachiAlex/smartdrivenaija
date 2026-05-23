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
      <div className="bg-gradient-to-br from-primary via-emerald-600 to-secondary text-white p-6 pb-10 rounded-b-[2rem] relative overflow-hidden">
        {/* Nigerian-inspired pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 nigerian-pattern" />
        </div>

        {/* Animated accent circle */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/30 blur-3xl"
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <h1 className="mb-2" style={{ fontSize: "1.875rem", fontWeight: 700, fontFamily: "Poppins" }}>
            Learning Modules
          </h1>
          <p className="text-white/80 font-medium">
            Complete all modules to master Nigerian driving
          </p>
        </motion.div>
      </div>

      <div className="p-6 space-y-4 -mt-4">
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
