import { useEffect } from "react";
import { motion } from "motion/react";
import { Car, Sparkles } from "lucide-react";
import { ParticleField } from "../components/ParticleField";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0F172A] overflow-hidden">
      {/* Cosmic mesh gradient blobs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-[#6366F1]/20 blur-[120px]"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-15%] w-[70%] h-[70%] rounded-full bg-[#8B5CF6]/20 blur-[100px]"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], x: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-[#F59E0B]/15 blur-[80px]"
      />

      {/* Floating particles */}
      <ParticleField count={20} colors={["#818CF8", "#F59E0B", "#22D3EE", "#EC4899", "#A78BFA"]} />

      {/* Orbital rings behind logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-64 h-64 rounded-full border border-[#6366F1]/20"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-52 h-52 rounded-full border border-[#8B5CF6]/15"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute w-72 h-72 rounded-full border border-dashed border-[#F59E0B]/10"
        />
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-8 relative z-10"
      >
        {/* Logo with glow */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <motion.div
            className="absolute inset-0 rounded-3xl bg-[#6366F1]/40 blur-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-2xl shadow-[#6366F1]/30">
            <Car className="w-20 h-20 text-white" strokeWidth={1.5} />
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-[#F59E0B]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title with warp reveal */}
        <div className="text-center space-y-3">
          <motion.h1
            initial={{ opacity: 0, filter: "blur(12px)", scale: 1.1, y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-white text-4xl font-extrabold tracking-tight"
            style={{ fontFamily: "Poppins", textShadow: "0 0 40px rgba(99,102,241,0.3)" }}
          >
            SmartDrive{" "}
            <span className="bg-gradient-to-r from-[#F59E0B] to-[#FB923C] bg-clip-text text-transparent">
              Naija
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, filter: "blur(8px)", y: 15 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-[#94A3B8] text-lg font-medium"
            style={{ fontFamily: "Inter" }}
          >
            Learn Smart. Drive Safe.
          </motion.p>
        </div>

        {/* Animated loading dots */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="flex gap-3 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 1, 0.3],
                y: [0, -6, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
