import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { BookOpen, Globe, Award, WifiOff, Sparkles } from "lucide-react";
import { ParticleField } from "../components/ParticleField";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: BookOpen,
    title: "Master Nigerian Driving Rules",
    description: "Learn with interactive lessons aligned with FRSC curriculum and Nigerian road standards.",
    meshColor: "#818CF8",
    accentColor: "#6366F1",
  },
  {
    icon: Globe,
    title: "Learn in Your Language",
    description: "Study in English, Hausa, Yoruba, Igbo, or Pidgin. Education in your mother tongue.",
    meshColor: "#22D3EE",
    accentColor: "#06B6D4",
  },
  {
    icon: Award,
    title: "Practice & Earn Certificates",
    description: "Take mock tests, track your progress, and earn certificates to prove your knowledge.",
    meshColor: "#F59E0B",
    accentColor: "#D97706",
  },
  {
    icon: WifiOff,
    title: "Study Anywhere, Anytime",
    description: "Download lessons and learn offline. No internet? No problem!",
    meshColor: "#EC4899",
    accentColor: "#DB2777",
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

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0, scale: 0.95, filter: "blur(4px)" }),
    center: { x: 0, opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0, scale: 0.95, filter: "blur(4px)" }),
  };

  return (
    <div className="size-full flex flex-col bg-[#FAFBFF] relative overflow-hidden">
      {/* Cosmic mesh background blobs */}
      <motion.div
        key={`blob-a-${currentSlide}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className="absolute top-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full blur-[100px] pointer-events-none"
        style={{ background: `radial-gradient(circle, ${slide.meshColor}30 0%, transparent 70%)` }}
      />
      <motion.div
        key={`blob-b-${currentSlide}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="absolute bottom-[20%] left-[-15%] w-[50%] h-[50%] rounded-full blur-[90px] pointer-events-none"
        style={{ background: `radial-gradient(circle, #8B5CF620 0%, transparent 70%)` }}
      />

      {/* Subtle particles */}
      <ParticleField count={8} colors={[slide.meshColor, "#8B5CF6"]} className="opacity-60" />

      {/* Skip button */}
      <div className="flex justify-end p-4 relative z-10">
        <Button variant="ghost" onClick={onComplete} className="text-muted-foreground hover:text-foreground">
          Skip
        </Button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md flex flex-col items-center text-center"
          >
            {/* Icon with orbital rings */}
            <div className="relative mb-10">
              {/* Outer orbital ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-20px] rounded-full border border-dashed"
                style={{ borderColor: `${slide.meshColor}30` }}
              />
              {/* Inner orbital ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-8px] rounded-full border"
                style={{ borderColor: `${slide.meshColor}20` }}
              />
              {/* Glow behind icon */}
              <motion.div
                className="absolute inset-0 rounded-3xl blur-xl"
                style={{ backgroundColor: `${slide.meshColor}40` }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              {/* Icon container */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative p-10 rounded-3xl bg-gradient-to-br from-white to-[#FAFBFF] shadow-xl"
                style={{ boxShadow: `0 20px 40px ${slide.meshColor}20` }}
              >
                <Icon className="w-16 h-16" style={{ color: slide.accentColor }} strokeWidth={1.5} />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: slide.meshColor }} />
                </motion.div>
              </motion.div>
            </div>

            <h2
              className="mb-4 px-4 text-[#0F172A]"
              style={{ fontSize: "1.75rem", fontWeight: 700, fontFamily: "Poppins" }}
            >
              {slide.title}
            </h2>
            <p className="text-[#64748B] text-lg leading-relaxed px-4">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-8 relative z-10">
        {/* Progress dots with spring physics */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, index) => (
            <motion.div
              key={index}
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="h-2 rounded-full"
              style={{
                width: index === currentSlide ? 32 : 8,
                backgroundColor: index === currentSlide ? slide.accentColor : "#E2E8F0",
              }}
            />
          ))}
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={nextSlide}
            className="w-full h-12 shadow-lg"
            size="lg"
            style={{
              background: `linear-gradient(135deg, ${slide.accentColor}, ${slide.meshColor})`,
              boxShadow: `0 8px 24px ${slide.meshColor}40`,
            }}
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
