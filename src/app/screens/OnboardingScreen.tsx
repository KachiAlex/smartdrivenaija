import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Logo } from "../components/Logo";

interface OnboardingScreenProps {
  onComplete: () => void;
}

/* ---------- Slide data ---------- */
const SLIDES = [
  {
    id: 0,
    image: "/assets/onboarding/1.png",
    hasDarkBg: true,
    showLogo: true,
    title: "Learn Smart. Drive Safe.",
    highlightWord: "Safe.",
    description:
      "Your AI-powered partner for mastering Nigerian driving rules and passing with confidence.",
  },
  {
    id: 1,
    image: "/assets/onboarding/2.png",
    hasDarkBg: false,
    number: "01",
    title: "Master Nigerian Driving Rules",
    description:
      "Interactive lessons designed to help you understand, remember, and apply the rules of the road.",
  },
  {
    id: 2,
    image: "/assets/onboarding/3.png",
    hasDarkBg: false,
    number: "02",
    title: "Learn in Your Language",
    description:
      "Study in English, Hausa, Yoruba, Igbo and Pidgin — with clear audio narration for every lesson.",
  },
  {
    id: 3,
    image: "/assets/onboarding/4.png",
    hasDarkBg: false,
    number: "03",
    title: "Practice. Test. Succeed.",
    description:
      "Take mock tests, track your progress, earn certificates and become a confident, safe driver.",
  },
];

/* ---------- Preload images ---------- */
function usePreload(src: string) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
  }, [src]);
  return loaded;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  /* Preload next image */
  const nextIndex = Math.min(currentSlide + 1, SLIDES.length - 1);
  usePreload(SLIDES[nextIndex].image);

  const nextSlide = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    } else {
      onComplete();
    }
  }, [currentSlide, onComplete]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((s) => s - 1);
    }
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  /* Swipe handler */
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      nextSlide();
    } else if ((info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) && currentSlide > 0) {
      prevSlide();
    }
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  /* Slide 0: full-bleed image with centered text overlay */
  const WelcomeOverlay = () => (
    <motion.div
      key="welcome"
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col items-center"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      {/* Logo centered in upper area */}
      <motion.div
        className="mt-[15vh]"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Logo size={120} />
      </motion.div>

      {/* Text content — positioned lower on the image */}
      <div className="mt-auto mb-24 px-8 text-center max-w-sm">
        <motion.h2
          className="text-white text-[1.75rem] font-bold leading-tight mb-3"
          style={{ fontFamily: "Poppins" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Learn Smart.
          <br />
          Drive{" "}
          <span className="text-[#F4A261]">{slide.highlightWord}</span>
        </motion.h2>
        <motion.p
          className="text-white/80 text-sm leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          {slide.description}
        </motion.p>

        {/* Next button for welcome slide */}
        <motion.button
          onClick={nextSlide}
          className="mt-6 px-8 py-3 rounded-full bg-white text-[#1D3557] font-semibold text-sm shadow-lg"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Get Started <ArrowRight className="w-4 h-4 inline ml-1" />
        </motion.button>
      </div>
    </motion.div>
  );

  /* Slides 1-3: full-bleed image with white bottom card */
  const ContentOverlay = () => (
    <motion.div
      key={`slide-${slide.id}`}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
    >
      {/* Top area — illustration fills this naturally via background image */}
      <div className="flex-1" />

      {/* White bottom card */}
      <motion.div
        className="bg-white rounded-t-[2.5rem] px-8 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Slide number */}
        <div className="flex items-center gap-3 mb-5">
          <span
            className="text-[#E63946] text-sm font-bold"
            style={{ fontFamily: "Poppins" }}
          >
            {slide.number}
          </span>
          <div className="flex-1 h-[1px] bg-[#E2E8F0]" />
        </div>

        {/* Title */}
        <h2
          className="text-[#0F172A] text-[1.5rem] font-bold leading-tight mb-3"
          style={{ fontFamily: "Poppins" }}
        >
          {slide.title}
        </h2>

        {/* Description */}
        <p className="text-[#64748B] text-[0.95rem] leading-relaxed mb-8">
          {slide.description}
        </p>

        {/* Dots + Next button row */}
        <div className="flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-2">
            {SLIDES.map((_, index) => (
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
                    backgroundColor:
                      index === currentSlide ? "#E63946" : "#E2E8F0",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Next / Get Started button */}
          <motion.button
            onClick={nextSlide}
            className="w-14 h-14 rounded-full bg-[#1D3557] flex items-center justify-center shadow-lg shadow-[#1D3557]/25"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            {isLast ? (
              <Check className="w-6 h-6 text-white" strokeWidth={2.5} />
            ) : (
              <ArrowRight className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0A1628] overflow-hidden">
      {/* Background image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={slide.image}
          src={slide.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>

      {/* Dark overlay for slide 0 (welcome screen has dark background image) */}
      {slide.hasDarkBg && (
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-[1]" />
      )}

      {/* Skip button */}
      <div className="absolute top-0 right-0 p-6 z-30">
        <motion.button
          onClick={onComplete}
          className={`text-sm font-medium transition-colors ${
            slide.hasDarkBg
              ? "text-white/80 hover:text-white"
              : "text-[#0F172A]/70 hover:text-[#0F172A]"
          }`}
          whileTap={{ scale: 0.95 }}
        >
          Skip
        </motion.button>
      </div>

      {/* Slide content overlay */}
      <div className="relative flex-1 z-10">
        <AnimatePresence mode="wait" custom={direction}>
          {slide.id === 0 ? <WelcomeOverlay /> : <ContentOverlay />}
        </AnimatePresence>
      </div>

      {/* Dots for slide 0 (welcome) since it doesn't have the card */}
      {slide.id === 0 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-20">
          {SLIDES.map((_, index) => (
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
                  backgroundColor:
                    index === currentSlide ? "#E63946" : "rgba(255,255,255,0.4)",
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
