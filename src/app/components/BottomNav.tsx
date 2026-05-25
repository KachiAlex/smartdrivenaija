import { Home, BookOpen, Trophy, Award, Settings, Wallet } from "lucide-react";
import { motion } from "motion/react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "modules", label: "Modules", icon: BookOpen },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "mock-test", label: "Mock Test", icon: Award },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "settings", label: "Settings", icon: Settings },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const activeIndex = navItems.findIndex((i) => i.id === activeTab);

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div
        className="relative flex items-center justify-between px-2 py-2 rounded-[2rem] shadow-2xl shadow-[#0F172A]/10 border border-white/20"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)" }}
      >
        {/* Liquid morphing indicator */}
        <motion.div
          className="absolute h-10 rounded-[1.25rem] z-0"
          style={{
            background: "linear-gradient(135deg, #E63946, #F4A261)",
            top: "50%",
            marginTop: -20,
          }}
          initial={false}
          animate={{
            width: "16.66%",
            x: `${activeIndex * 100 + 4}%`,
            scale: [1, 1.05, 1],
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 0.8,
          }}
        />

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="relative flex flex-col items-center justify-center gap-1 py-2 px-2 z-10 transition-colors w-[16.66%]"
              style={{ color: isActive ? "#ffffff" : "#64748B" }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={isActive ? { y: [0, -4, 0], scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className="text-xs font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
