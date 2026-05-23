import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Download } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
}

/* ───────── Slide 1: Road Scene ───────── */
function RoadSceneIllustration() {
  return (
    <div className="relative w-full h-[280px] flex items-center justify-center">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFD6A5]/30 via-[#FFECD2]/20 to-transparent rounded-[2rem]" />

      {/* Road */}
      <svg className="absolute bottom-0 left-0 right-0 w-full h-32" viewBox="0 0 400 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="120">
            <stop offset="0%" stopColor="#2D3436" />
            <stop offset="100%" stopColor="#1A1A2E" />
          </linearGradient>
        </defs>
        <path d="M0 80 Q200 60 400 80 L400 120 L0 120Z" fill="url(#roadGrad)" />
        {/* Road lines */}
        <motion.line x1="0" y1="85" x2="400" y2="85" stroke="#F4A261" strokeWidth="2" strokeDasharray="12 12"
          animate={{ x1: [0, -24], x2: [400, 376] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
      </svg>

      {/* Road signs */}
      <motion.div className="absolute top-4 left-6"
        animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <div className="w-14 h-14 rounded-full bg-white border-4 border-[#E63946] flex items-center justify-center shadow-lg">
          <span className="text-[#E63946] font-bold text-sm">50</span>
        </div>
      </motion.div>

      <motion.div className="absolute top-12 right-8"
        animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
        <div className="w-12 h-12 bg-[#E63946] rounded-lg flex items-center justify-center shadow-lg rotate-12">
          <span className="text-white font-bold text-[10px] -rotate-12">STOP</span>
        </div>
      </motion.div>

      {/* Person studying on phone */}
      <motion.div className="relative z-10"
        animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <div className="w-28 h-28 rounded-[2rem] bg-white shadow-xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/10 to-[#F59E0B]/10" />
          {/* Simple person silhouette */}
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="16" r="10" fill="#1D3557" />
            <path d="M15 55 Q30 35 45 55" stroke="#1D3557" strokeWidth="12" strokeLinecap="round" />
            {/* Phone */}
            <rect x="32" y="30" width="14" height="22" rx="3" fill="#457B9D" />
            <rect x="34" y="32" width="10" height="16" rx="1" fill="#A8DADC" />
          </svg>
        </div>
      </motion.div>

      {/* Floating sparkles */}
      {[...Array(3)].map((_, i) => (
        <motion.div key={i} className="absolute w-2 h-2 rounded-full bg-[#F4A261]"
          style={{ top: `${15 + i * 20}%`, left: `${20 + i * 25}%` }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }} />
      ))}
    </div>
  );
}

/* ───────── Slide 2: Language Bubbles ───────── */
function LanguageBubblesIllustration() {
  const bubbles = [
    { text: "Hello", color: "#F4A261", x: "-60%", y: "-40%", delay: 0 },
    { text: "Ndewo", color: "#2A9D8F", x: "50%", y: "-50%", delay: 0.3 },
    { text: "Barka da safe", color: "#E63946", x: "-80%", y: "20%", delay: 0.6 },
    { text: "E káàbò", color: "#1D3557", x: "60%", y: "10%", delay: 0.9 },
    { text: "Good morning (My Pidgin)", color: "#457B9D", x: "-20%", y: "55%", delay: 1.2 },
  ];

  return (
    <div className="relative w-full h-[280px] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-[#A8DADC]/20 via-[#F1FAEE]/30 to-transparent rounded-[2rem]" />

      {/* Center person */}
      <motion.div className="relative z-10"
        animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F4A261]/20 to-[#E63946]/20 flex items-center justify-center shadow-lg">
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
            <circle cx="25" cy="14" r="10" fill="#1D3557" />
            <path d="M10 48 Q25 28 40 48" stroke="#1D3557" strokeWidth="10" strokeLinecap="round" />
            {/* Headwrap */}
            <path d="M12 8 Q25 -2 38 8" stroke="#E63946" strokeWidth="4" fill="none" />
            <path d="M10 12 Q25 2 40 12" stroke="#F4A261" strokeWidth="3" fill="none" />
          </svg>
        </div>
      </motion.div>

      {/* Floating bubbles */}
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute px-3 py-1.5 rounded-xl text-white text-xs font-semibold shadow-lg"
          style={{
            backgroundColor: b.color,
            left: `calc(50% + ${b.x})`,
            top: `calc(50% + ${b.y})`,
          }}
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: b.delay + 0.3, duration: 0.5, ease: "backOut" }}
        >
          {b.text}
        </motion.div>
      ))}

      {/* Globe icon */}
      <motion.div className="absolute bottom-4 right-8"
        animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="#457B9D" strokeWidth="2" />
          <ellipse cx="16" cy="16" rx="6" ry="14" stroke="#457B9D" strokeWidth="1.5" />
          <line x1="2" y1="16" x2="30" y2="16" stroke="#457B9D" strokeWidth="1.5" />
          <line x1="4" y1="10" x2="28" y2="10" stroke="#457B9D" strokeWidth="1" />
          <line x1="4" y1="22" x2="28" y2="22" stroke="#457B9D" strokeWidth="1" />
        </svg>
      </motion.div>
    </div>
  );
}

/* ───────── Slide 3: Test Results ───────── */
function TestResultsIllustration() {
  return (
    <div className="relative w-full h-[280px] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-[#F1FAEE]/40 via-[#A8DADC]/20 to-transparent rounded-[2rem]" />

      {/* Phone mockup */}
      <motion.div className="relative z-10"
        animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <div className="w-36 h-56 bg-white rounded-[1.5rem] shadow-2xl border-4 border-[#1D3557] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Screen content */}
          <div className="text-center space-y-2">
            <p className="text-[10px] text-[#64748B] font-medium">Mock Test Result</p>
            <motion.p className="text-[#2A9D8F] text-2xl font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}>
              PASS
            </motion.p>
            {/* Circular progress */}
            <div className="relative w-16 h-16 mx-auto">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#2A9D8F" strokeWidth="3" strokeDasharray="85, 100"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 15 }}
                  transition={{ delay: 0.8, duration: 1.2, ease: "easeOut" }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#1D3557]">85%</span>
            </div>
            <p className="text-[10px] text-[#F4A261]">Great Job!</p>
          </div>
        </div>
      </motion.div>

      {/* Trophy */}
      <motion.div className="absolute top-8 left-6"
        animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M10 8 L10 16 Q10 28 24 28 Q38 28 38 16 L38 8Z" fill="#F4A261" />
          <rect x="18" y="28" width="12" height="8" fill="#E9C46A" />
          <path d="M14 36 L34 36 L30 44 L18 44Z" fill="#F4A261" />
          <path d="M10 8 L6 8 L6 14 Q6 18 10 18Z" fill="#E9C46A" />
          <path d="M38 8 L42 8 L42 14 Q42 18 38 18Z" fill="#E9C46A" />
        </svg>
      </motion.div>

      {/* Target icon */}
      <motion.div className="absolute bottom-12 right-6"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <circle cx="22" cy="22" r="18" stroke="#E63946" strokeWidth="2" />
          <circle cx="22" cy="22" r="12" stroke="#E63946" strokeWidth="2" />
          <circle cx="22" cy="22" r="6" fill="#E63946" />
          <line x1="22" y1="4" x2="22" y2="12" stroke="#E63946" strokeWidth="2" />
          <line x1="22" y1="32" x2="22" y2="40" stroke="#E63946" strokeWidth="2" />
          <line x1="4" y1="22" x2="12" y2="22" stroke="#E63946" strokeWidth="2" />
          <line x1="32" y1="22" x2="40" y2="22" stroke="#E63946" strokeWidth="2" />
        </svg>
      </motion.div>

      {/* Check badge */}
      <motion.div className="absolute top-16 right-4"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <div className="w-10 h-10 rounded-full bg-[#2A9D8F] flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 10 L9 14 L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────── Main component ───────── */
const slides = [
  {
    number: "01",
    title: "Master Nigerian Driving Rules",
    description: "Interactive lessons designed to help you understand, remember, and apply the rules of the road.",
    illustration: RoadSceneIllustration,
    dotColor: "#E63946",
  },
  {
    number: "02",
    title: "Learn in Your Language",
    description: "Study in English, Hausa, Yoruba, Igbo and Pidgin — with clear audio narration for every lesson.",
    illustration: LanguageBubblesIllustration,
    dotColor: "#E63946",
  },
  {
    number: "03",
    title: "Practice. Test. Succeed.",
    description: "Take mock tests, track your progress, earn certificates and become a confident, safe driver.",
    illustration: TestResultsIllustration,
    dotColor: "#E63946",
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const slide = slides[currentSlide];
  const Illustration = slide.illustration;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="size-full flex flex-col bg-[#FAFBFF] relative overflow-hidden">
      {/* Skip button */}
      <div className="flex justify-end p-6 relative z-20">
        <motion.button
          onClick={onComplete}
          className="text-[#64748B] text-sm font-medium hover:text-[#0F172A] transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          Skip
        </motion.button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col px-6 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            {/* Illustration area */}
            <Illustration />

            {/* Slide number + text */}
            <div className="mt-8 w-full max-w-sm">
              {/* Number indicator */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#E63946] text-sm font-bold" style={{ fontFamily: "Poppins" }}>
                  {slide.number}
                </span>
                <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
              </div>

              <h2
                className="text-[#0F172A] mb-3"
                style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "Poppins", lineHeight: 1.3 }}
              >
                {slide.title}
              </h2>
              <p className="text-[#64748B] text-base leading-relaxed">
                {slide.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-8 pt-4 relative z-20">
        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="transition-all duration-300"
            >
              <div
                className="rounded-full"
                style={{
                  width: index === currentSlide ? 24 : 8,
                  height: 8,
                  backgroundColor: index === currentSlide ? "#E63946" : "#E2E8F0",
                }}
              />
            </button>
          ))}
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center gap-4">
          {/* Study anywhere info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#F1FAEE] flex items-center justify-center">
              <Download className="w-5 h-5 text-[#2A9D8F]" />
            </div>
            <div>
              <p className="text-[#0F172A] text-sm font-semibold" style={{ fontFamily: "Poppins" }}>
                Study anywhere, anytime
              </p>
              <p className="text-[#64748B] text-xs">
                Download lessons and learn even without internet.
              </p>
            </div>
          </div>

          {/* Next / Get Started button */}
          <motion.button
            onClick={nextSlide}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-[#E63946] to-[#F4A261] flex items-center justify-center shadow-lg shadow-[#E63946]/30"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <ArrowRight className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
