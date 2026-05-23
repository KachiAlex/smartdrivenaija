import { useEffect } from "react";
import { motion } from "motion/react";
import { Logo } from "../components/Logo";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A1628] overflow-hidden">
      {/* Subtle glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-[#E63946]/10 blur-[80px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] right-[15%] w-48 h-48 rounded-full bg-[#F4A261]/10 blur-[60px]"
      />

      {/* Center content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 relative z-10"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Logo size={140} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex flex-col items-center gap-1"
        >
          <h1
            className="text-white text-3xl font-bold tracking-tight"
            style={{ fontFamily: "Poppins" }}
          >
            SmartDrive
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-[2px] w-6 bg-white/40 rounded-full" />
            <span
              className="text-[#E63946] text-base font-extrabold tracking-[0.15em]"
              style={{ fontFamily: "Poppins" }}
            >
              NAIJA
            </span>
            <div className="h-[2px] w-6 bg-white/40 rounded-full" />
          </div>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-2 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-[#F4A261]"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
