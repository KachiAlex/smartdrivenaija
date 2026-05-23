import { useEffect } from "react";
import { motion } from "motion/react";
import { Car } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="size-full flex flex-col items-center justify-center bg-gradient-to-br from-primary via-emerald-600 to-secondary relative overflow-hidden">
      {/* Nigerian-inspired pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 nigerian-pattern" />
      </div>

      {/* Animated background circles */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-96 h-96 rounded-full bg-accent/20 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        className="absolute w-64 h-64 rounded-full bg-white/10 blur-3xl"
      />

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6 relative z-10"
      >
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            repeatDelay: 0.5,
            ease: "easeInOut"
          }}
          className="p-8 rounded-3xl bg-white shadow-2xl"
        >
          <Car className="w-24 h-24 text-primary" strokeWidth={2} />
        </motion.div>

        <div className="text-center">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-white mb-3"
            style={{ fontSize: "2.25rem", fontWeight: 800, fontFamily: "Poppins" }}
          >
            SmartDrive Naija
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-white/90 text-lg font-medium"
            style={{ fontFamily: "Inter" }}
          >
            Learn Smart. Drive Safe.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-2 mt-6"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
              }}
              className="w-3 h-3 rounded-full bg-white"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
