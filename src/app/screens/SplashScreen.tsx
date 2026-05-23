import { useEffect } from "react";
import { motion } from "motion/react";
import { Logo, LogoText } from "../components/Logo";

interface SplashScreenProps {
  onComplete: () => void;
}

/* ---------- City skyline SVG ---------- */
function CitySkyline() {
  const buildings = [
    { x: 0, w: 30, h: 40 }, { x: 25, w: 20, h: 60 }, { x: 40, w: 35, h: 30 },
    { x: 70, w: 25, h: 70 }, { x: 90, w: 30, h: 45 }, { x: 115, w: 20, h: 55 },
    { x: 130, w: 35, h: 35 }, { x: 160, w: 25, h: 65 }, { x: 180, w: 20, h: 40 },
  ];
  return (
    <svg viewBox="0 0 400 100" className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="cityGrad" x1="0" y1="0" x2="0" y2="100">
          <stop offset="0%" stopColor="#1A2D5C" />
          <stop offset="100%" stopColor="#0A1628" />
        </linearGradient>
      </defs>
      {buildings.map((b, i) => (
        <motion.rect
          key={i}
          x={b.x * 2}
            y={100 - b.h}
          width={b.w * 2}
          height={b.h}
          fill="url(#cityGrad)"
          initial={{ y: 120 }}
          animate={{ y: 100 - b.h }}
          transition={{ delay: 1.2 + i * 0.08, duration: 0.6, ease: "backOut" }}
        />
      ))}
    </svg>
  );
}

/* ---------- Animated car ---------- */
function AnimatedCar() {
  return (
    <motion.div
      className="absolute bottom-[8%] left-1/2 -translate-x-1/2 z-20"
      initial={{ x: "-150%", opacity: 0 }}
      animate={{ x: "-50%", opacity: 1 }}
      transition={{ delay: 1, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg width="120" height="50" viewBox="0 0 120 50" fill="none">
        {/* Headlight beams */}
        <motion.path
          d="M110 30 L180 15 L180 45 Z"
          fill="url(#beam)"
          opacity="0.4"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <defs>
          <linearGradient id="beam" x1="110" y1="30" x2="180" y2="30">
            <stop offset="0%" stopColor="#F4A261" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F4A261" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Car body */}
        <path d="M10 35 L20 20 L50 15 L85 18 L100 28 L110 32 L110 38 L100 40 L20 40 Z" fill="#1D3557" />
        <path d="M22 22 L48 17 L82 20 L95 28 L20 28 Z" fill="#2A4A6F" />
        {/* Windows */}
        <path d="M25 24 L45 19 L70 21 L80 27 L25 27 Z" fill="#A8DADC" opacity="0.8" />
        {/* Wheels */}
        <circle cx="30" cy="38" r="8" fill="#0A1628" />
        <circle cx="30" cy="38" r="4" fill="#457B9D" />
        <circle cx="90" cy="38" r="8" fill="#0A1628" />
        <circle cx="90" cy="38" r="4" fill="#457B9D" />
        {/* Headlight */}
        <ellipse cx="108" cy="32" rx="4" ry="3" fill="#F4A261" />
        {/* Taillight */}
        <ellipse cx="12" cy="34" rx="3" ry="2" fill="#E63946" />
      </svg>
    </motion.div>
  );
}

/* ---------- Road with moving lines ---------- */
function AnimatedRoad() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-[#0A1628] z-10 overflow-hidden">
      {/* Road surface */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] to-[#1A2D5C]" />
      {/* Moving lane markings */}
      <div className="absolute top-1/2 left-0 right-0 h-[2px]">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 w-12 h-full bg-white/30 rounded-full"
            style={{ left: `${i * 15}%` }}
            animate={{ x: ["0%", "-100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Twinkling stars ---------- */
function StarField() {
  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 3,
    duration: Math.random() * 2 + 1,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Main component ---------- */
export function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A1628] overflow-hidden">
      {/* Star field background */}
      <StarField />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0F1B3A] to-[#0A1628] z-0" />

      {/* Glowing orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[10%] w-64 h-64 rounded-full bg-[#E63946]/10 blur-[80px] z-0"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] right-[15%] w-48 h-48 rounded-full bg-[#F4A261]/10 blur-[60px] z-0"
      />

      {/* Center content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-6 relative z-20 -mt-16"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Logo size={140} />
        </motion.div>

        {/* Title */}
        <LogoText />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 1.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/70 text-base font-medium max-w-[260px] text-center leading-relaxed"
          style={{ fontFamily: "Inter" }}
        >
          Your AI-powered partner for mastering Nigerian driving rules and passing with confidence.
        </motion.p>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.5 }}
          className="w-48 h-1 bg-white/10 rounded-full mt-6 overflow-hidden"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-[#E63946] to-[#F4A261] rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.2, delay: 0.5, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>

      {/* Animated car + road */}
      <AnimatedCar />
      <AnimatedRoad />

      {/* City skyline */}
      <div className="absolute bottom-[10%] left-0 right-0 z-[15] opacity-80">
        <CitySkyline />
      </div>
    </div>
  );
}
