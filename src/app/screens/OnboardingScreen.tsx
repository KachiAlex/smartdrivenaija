import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Logo } from "../components/Logo";

interface OnboardingScreenProps {
  onComplete: () => void;
}

/* ---------- Slide data ---------- */
const SLIDES = [
  {
    id: 0,
    image: "/assets/onboarding/1.webp",
    hasDarkBg: true,
    showLogo: true,
    title: "Learn Smart. Drive Safe.",
    highlightWord: "Safe.",
    description:
      "Your AI-powered partner for mastering Nigerian driving rules and passing with confidence.",
  },
  {
    id: 1,
    image: "/assets/onboarding/2.webp",
    hasDarkBg: false,
    number: "01",
    title: "Master Nigerian Driving Rules",
    description:
      "Interactive lessons designed to help you understand, remember, and apply the rules of the road.",
  },
  {
    id: 2,
    image: "/assets/onboarding/3.webp",
    hasDarkBg: false,
    number: "02",
    title: "Learn in Your Language",
    description:
      "Study in English, Hausa, Yoruba, Igbo and Pidgin — with clear audio narration for every lesson.",
  },
  {
    id: 3,
    image: "/assets/onboarding/4.webp",
    hasDarkBg: false,
    number: "03",
    title: "Practice. Test. Succeed.",
    description:
      "Take mock tests, track your progress, earn certificates and become a confident, safe driver.",
  },
];

/* ---------- Preload all images on mount ---------- */
function usePreloadAll(sources: string[]) {
  const [loadedCount, setLoadedCount] = useState(0);
  const total = sources.length;
  useEffect(() => {
    let mounted = true;
    sources.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => mounted && setLoadedCount((c) => c + 1);
      img.onerror = () => mounted && setLoadedCount((c) => c + 1);
    });
    return () => { mounted = false; };
  }, [sources]);
  return loadedCount >= total;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(() => {
    try {
      const saved = sessionStorage.getItem('onboarding_slide');
      return saved ? Math.min(Math.max(parseInt(saved, 10), 0), SLIDES.length - 1) : 0;
    } catch { return 0; }
  });
  const [direction, setDirection] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  /* Preload all images immediately */
  const allImages = SLIDES.map((s) => s.image);
  const allLoaded = usePreloadAll(allImages);

  /* Haptic feedback helper */
  const triggerHaptic = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(20); } catch {}
    }
  }, []);

  const nextSlide = useCallback(() => {
    triggerHaptic();
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    } else {
      try { sessionStorage.removeItem('onboarding_slide'); } catch {}
      onComplete();
    }
  }, [currentSlide, onComplete, triggerHaptic]);

  const prevSlide = useCallback(() => {
    triggerHaptic();
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((s) => s - 1);
    }
  }, [currentSlide, triggerHaptic]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentSlide) return;
    triggerHaptic();
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide, triggerHaptic]);

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  /* Persist slide index for resume */
  useEffect(() => {
    try { sessionStorage.setItem('onboarding_slide', String(currentSlide)); } catch {}
  }, [currentSlide]);

  /* Auto-advance every 6s, pauses on hover/touch */
  const resetAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    if (isLast) return;
    autoAdvanceRef.current = setInterval(() => {
      if (!isPausedRef.current) nextSlide();
    }, 6000);
  }, [isLast, nextSlide]);

  useEffect(() => {
    resetAutoAdvance();
    return () => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current); };
  }, [currentSlide, resetAutoAdvance]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const pause = () => { isPausedRef.current = true; };
    const resume = () => { isPausedRef.current = false; };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('touchend', resume, { passive: true });
    return () => {
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resume);
    };
  }, []);

  /* Keyboard navigation */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isLast) onComplete();
        else nextSlide();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, onComplete, isLast]);

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

  /* Spring-based transitions for smooth motion, instant for reduced motion */
  const springTransition = { type: "spring" as const, stiffness: 300, damping: 30 };
  const instantTransition = { duration: 0 };
  const contentTransition = shouldReduceMotion ? instantTransition : springTransition;

  const variants = {
    enter: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? 100 : -100,
      opacity: shouldReduceMotion ? 1 : 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? -100 : 100,
      opacity: shouldReduceMotion ? 1 : 0,
    }),
  };

  const bgVariants = {
    enter: { opacity: 0, scale: shouldReduceMotion ? 1 : 1.05 },
    center: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 },
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
      transition={contentTransition}
      className="absolute inset-0 flex flex-col items-center cursor-grab active:cursor-grabbing"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${currentSlide + 1} of ${SLIDES.length}: ${slide.title}`}
    >
      {/* Logo centered in upper area */}
      <motion.div
        className="mt-[15vh]"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={shouldReduceMotion ? instantTransition : { delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <Logo size={120} />
      </motion.div>

      {/* Text content — positioned lower on the image */}
      <div className="mt-auto mb-24 px-8 text-center max-w-sm">
        <motion.h2
          className="text-white text-[1.75rem] font-bold leading-tight mb-3"
          style={{ fontFamily: "Poppins" }}
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? instantTransition : { delay: 0.4, duration: 0.5 }}
        >
          Learn Smart.
          <br />
          Drive{" "}
          <span className="text-[#F4A261]">{slide.highlightWord}</span>
        </motion.h2>
        <motion.p
          className="text-white/80 text-sm leading-relaxed"
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? instantTransition : { delay: 0.55, duration: 0.5 }}
        >
          {slide.description}
        </motion.p>

        {/* Next button for welcome slide */}
        <motion.button
          onClick={nextSlide}
          className="mt-6 px-8 py-3 rounded-full bg-white text-[#1D3557] font-semibold text-sm shadow-lg"
          initial={{ opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? instantTransition : { delay: 0.7, duration: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Get started"
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
      transition={contentTransition}
      className="absolute inset-0 flex flex-col cursor-grab active:cursor-grabbing"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      role="group"
      aria-roledescription="slide"
      aria-label={`Slide ${currentSlide + 1} of ${SLIDES.length}: ${slide.title}`}
    >
      {/* Top area — illustration fills this naturally via background image */}
      <div className="flex-1" />

      {/* White bottom card */}
      <motion.div
        className="bg-white rounded-t-[2.5rem] px-8 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"
        initial={{ y: shouldReduceMotion ? 0 : 40, opacity: shouldReduceMotion ? 1 : 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={shouldReduceMotion ? instantTransition : { delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Back button */}
        {currentSlide > 0 && (
          <motion.button
            onClick={prevSlide}
            className="mb-4 flex items-center gap-1.5 text-[#64748B] text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] rounded px-1"
            whileTap={{ scale: 0.95 }}
            aria-label="Previous slide"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>
        )}

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
          <div className="flex gap-2" role="tablist" aria-label="Onboarding slides">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] rounded-full"
                role="tab"
                aria-selected={index === currentSlide}
                aria-label={`Go to slide ${index + 1}`}
              >
                <motion.div
                  className="rounded-full"
                  animate={{
                    width: index === currentSlide ? 24 : 8,
                    backgroundColor: index === currentSlide ? "#E63946" : "#E2E8F0",
                  }}
                  transition={shouldReduceMotion ? instantTransition : { duration: 0.3, ease: "easeInOut" }}
                  style={{ height: 8 }}
                />
              </button>
            ))}
          </div>

          {/* Next / Get Started button */}
          <motion.button
            onClick={nextSlide}
            className="w-14 h-14 rounded-full bg-[#1D3557] flex items-center justify-center shadow-lg shadow-[#1D3557]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4A261] focus-visible:ring-offset-2"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label={isLast ? "Get started" : "Next slide"}
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

  /* Progress bar width */
  const progress = ((currentSlide + 1) / SLIDES.length) * 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col bg-[#0A1628] overflow-hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="App onboarding"
      tabIndex={0}
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 z-50 h-1 bg-white/10">
        <motion.div
          className="h-full bg-[#E63946]"
          animate={{ width: `${progress}%` }}
          transition={shouldReduceMotion ? instantTransition : { duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Loading overlay */}
      <motion.div
        className="absolute inset-0 z-[60] bg-[#0A1628] flex items-center justify-center"
        initial={{ opacity: 1 }}
        animate={{ opacity: allLoaded ? 0 : 1, pointerEvents: allLoaded ? 'none' : 'auto' }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Logo size={60} />
        </motion.div>
      </motion.div>

      {/* Background image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={slide.image}
          src={slide.image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
          decoding="async"
          variants={bgVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={shouldReduceMotion ? instantTransition : { duration: 0.5, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Dark overlay for slide 0 (welcome screen has dark background image) */}
      {slide.hasDarkBg && (
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-[1]" />
      )}

      {/* Skip button */}
      <div className="absolute top-0 right-0 p-6 z-30">
        <motion.button
          onClick={() => {
            try { sessionStorage.removeItem('onboarding_slide'); } catch {}
            onComplete();
          }}
          className={`text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white rounded px-2 py-1 ${
            slide.hasDarkBg
              ? "text-white/80 hover:text-white focus-visible:ring-white"
              : "text-[#0F172A]/70 hover:text-[#0F172A] focus-visible:ring-[#1D3557]"
          }`}
          whileTap={{ scale: 0.95 }}
          aria-label="Skip onboarding"
        >
          Skip
        </motion.button>
      </div>

      {/* Slide counter — top left */}
      <div className="absolute top-0 left-0 p-6 z-30">
        <span className="text-xs font-semibold tracking-wider text-white/60">
          {currentSlide + 1} / {SLIDES.length}
        </span>
      </div>

      {/* Slide content overlay */}
      <div className="relative flex-1 z-10">
        <AnimatePresence mode="wait" custom={direction}>
          {slide.id === 0 ? <WelcomeOverlay /> : <ContentOverlay />}
        </AnimatePresence>
      </div>

      {/* Dots for slide 0 (welcome) since it doesn't have the card */}
      {slide.id === 0 && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-20" role="tablist" aria-label="Onboarding slides">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
              role="tab"
              aria-selected={index === currentSlide}
              aria-label={`Go to slide ${index + 1}`}
            >
              <motion.div
                className="rounded-full"
                animate={{
                  width: index === currentSlide ? 24 : 8,
                  backgroundColor: index === currentSlide ? "#E63946" : "rgba(255,255,255,0.4)",
                }}
                transition={shouldReduceMotion ? instantTransition : { duration: 0.3, ease: "easeInOut" }}
                style={{ height: 8 }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
