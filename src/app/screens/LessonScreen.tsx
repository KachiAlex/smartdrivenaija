import { useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Volume2, VolumeX, Download, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { toast } from "sonner";

interface LessonScreenProps {
  onNavigate: (screen: string, data?: { moduleId?: number }) => void;
  moduleId?: number | null;
  lessonId?: number | null;
}

export function LessonScreen({ onNavigate, moduleId }: LessonScreenProps) {
  const { currentModuleContent, loadModuleContent, completeLesson, loading } = useApp();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (moduleId) {
      loadModuleContent(moduleId);
    }
  }, [moduleId, loadModuleContent]);

  useEffect(() => {
    startTime.current = Date.now();
  }, [currentLessonIndex]);

  const content = currentModuleContent;
  const lessons = content?.lessons || [];
  const currentLesson = lessons[currentLessonIndex];
  const progressPercent = lessons.length > 0 ? ((currentLessonIndex + 1) / lessons.length) * 100 : 0;
  const completedCount = lessons.filter(l => l.completed).length;

  const handleComplete = async () => {
    if (!currentLesson) return;
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    try {
      await completeLesson(currentLesson.id, timeSpent);
      toast.success(`+${currentLesson.xpReward} XP earned!`);
    } catch {
      // Continue anyway — offline support would cache this
    }
  };

  const handleNext = async () => {
    await handleComplete();
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const handleTakeQuiz = async () => {
    await handleComplete();
    onNavigate("quiz", { moduleId: moduleId || undefined });
  };

  if (loading.moduleContent || !content) {
    return (
      <div className="size-full flex items-center justify-center bg-[#FAFBFF]">
        <Loader2 className="w-10 h-10 text-[#E63946] animate-spin" />
      </div>
    );
  }

  // Render markdown-like content
  const renderContent = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((para, i) => {
      if (para.startsWith('**') && para.endsWith('**')) {
        return <h4 key={i} className="mt-4 mb-2 text-[#0F172A] font-bold text-lg" style={{ fontFamily: "Poppins" }}>{para.replace(/\*\*/g, '')}</h4>;
      }
      if (para.includes('•')) {
        const lines = para.split('\n').filter(l => l.trim());
        const heading = lines[0]?.startsWith('•') ? null : lines.shift();
        return (
          <div key={i} className="space-y-2">
            {heading && <p className="text-[#64748B] font-medium">{heading}</p>}
            <ul className="space-y-2 ml-1">
              {lines.map((line, j) => (
                <li key={j} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#E63946] mt-0.5 flex-shrink-0" />
                  <span className="text-[#64748B] leading-relaxed">{line.replace(/^•\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      return <p key={i} className="text-[#64748B] leading-relaxed">{para}</p>;
    });
  };

  return (
    <div className="size-full flex flex-col bg-[#FAFBFF]">
      <div className="relative p-6 pb-6 rounded-b-[2.5rem] overflow-hidden text-white"
        style={{ background: "linear-gradient(135deg, #E63946 0%, #F4A261 40%, #0A1628 100%)" }}
      >
        {/* Animated mesh blobs */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#E63946]/30 blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-[#F4A261]/20 blur-[70px]"
        />
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => onNavigate("modules")}
          className="relative z-10 flex items-center gap-2 mb-4 text-white/90 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mb-4"
        >
          <Badge className="mb-2 bg-white/20 text-white border-white/30">
            {content.module.title}
          </Badge>
          <h2 className="text-white mb-1" style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "Poppins" }}>
            {currentLesson?.title || 'Loading...'}
          </h2>
          <p className="text-white/80">{currentLesson?.estimatedMinutes} min • {currentLesson?.xpReward} XP</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative z-10 flex items-center gap-2 mb-2"
        >
          <Progress value={progressPercent} className="flex-1 h-2 bg-white/20" />
          <span className="text-sm font-medium" style={{ fontWeight: 600 }}>
            {currentLessonIndex + 1}/{lessons.length}
          </span>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 p-4 bg-white border-b border-[#E2E8F0]">
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E2E8F0] hover:bg-[#E2E8F0]/80 transition-colors text-[#0F172A]"
        >
          {audioEnabled ? <Volume2 className="w-5 h-5 text-[#E63946]" /> : <VolumeX className="w-5 h-5 text-[#64748B]" />}
          <span className="text-sm font-medium">Audio {audioEnabled ? "On" : "Off"}</span>
        </button>

        <button
          onClick={() => setIsDownloaded(!isDownloaded)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E2E8F0] hover:bg-[#E2E8F0]/80 transition-colors text-[#0F172A]"
        >
          {isDownloaded ? <Check className="w-5 h-5 text-[#10B981]" /> : <Download className="w-5 h-5 text-[#64748B]" />}
          <span className="text-sm font-medium">{isDownloaded ? "Downloaded" : "Offline"}</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-4 bg-[#FAFBFF]">
        {currentLesson && (
          <motion.div
            key={currentLessonIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <h3 className="text-[#0F172A] text-xl font-bold" style={{ fontFamily: "Poppins" }}>{currentLesson.title}</h3>
            {renderContent(currentLesson.content)}
          </motion.div>
        )}
      </div>

      <div className="p-6 border-t border-[#E2E8F0] bg-white space-y-3">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 border-2 border-[#E2E8F0] hover:bg-[#E2E8F0]/50 text-[#0F172A]"
            onClick={handlePrevious}
            disabled={currentLessonIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {currentLessonIndex < lessons.length - 1 ? (
            <Button
              onClick={handleNext}
              className="flex-1 h-12 text-white"
              size="lg"
              style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
            >
              Next Lesson <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleTakeQuiz}
              className="flex-1 h-12 text-white"
              size="lg"
              style={{ background: "linear-gradient(135deg, #E63946, #F4A261)" }}
            >
              Take Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
