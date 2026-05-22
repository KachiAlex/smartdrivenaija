import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import {
  api,
  type Module,
  type ModuleContent,
  type UserProgress,
  type QuizResult,
  type MockTestStart,
  type MockTestResult,
  type QuizAnswer,
  type LeaderboardResponse,
} from '../lib/api';

interface AppState {
  modules: Module[];
  progress: UserProgress | null;
  currentModuleContent: ModuleContent | null;
  currentMockTest: MockTestStart | null;
  lastQuizResult: QuizResult | null;
  lastMockResult: MockTestResult | null;
  leaderboard: LeaderboardResponse | null;
  loading: Record<string, boolean>;
}

interface AppContextType extends AppState {
  loadModules: () => Promise<void>;
  loadProgress: () => Promise<void>;
  loadModuleContent: (moduleId: number) => Promise<ModuleContent>;
  completeLesson: (lessonId: number, timeSpentSeconds: number) => Promise<void>;
  submitQuiz: (moduleId: number, answers: QuizAnswer[], lessonId?: number) => Promise<QuizResult>;
  startMockTest: (count?: number) => Promise<MockTestStart>;
  submitMockTest: (testId: string, answers: QuizAnswer[], timeTakenSeconds: number) => Promise<MockTestResult>;
  loadLeaderboard: (period?: 'weekly' | 'alltime') => Promise<void>;
  setLoading: (key: string, value: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    modules: [],
    progress: null,
    currentModuleContent: null,
    currentMockTest: null,
    lastQuizResult: null,
    lastMockResult: null,
    leaderboard: null,
    loading: {},
  });

  const setLoading = useCallback((key: string, value: boolean) => {
    setState(s => ({ ...s, loading: { ...s.loading, [key]: value } }));
  }, []);

  const loadModules = useCallback(async () => {
    setLoading('modules', true);
    try {
      const modules = await api.getModules();
      setState(s => ({ ...s, modules }));
    } finally {
      setLoading('modules', false);
    }
  }, [setLoading]);

  const loadProgress = useCallback(async () => {
    setLoading('progress', true);
    try {
      const progress = await api.getProgress();
      setState(s => ({ ...s, progress }));
    } finally {
      setLoading('progress', false);
    }
  }, [setLoading]);

  const loadModuleContent = useCallback(async (moduleId: number) => {
    setLoading('moduleContent', true);
    try {
      const content = await api.getModuleContent(moduleId);
      setState(s => ({ ...s, currentModuleContent: content }));
      return content;
    } finally {
      setLoading('moduleContent', false);
    }
  }, [setLoading]);

  const completeLesson = useCallback(async (lessonId: number, timeSpentSeconds: number) => {
    await api.completeLesson(lessonId, timeSpentSeconds);
    // Refresh progress
    const progress = await api.getProgress();
    setState(s => ({ ...s, progress }));
  }, []);

  const submitQuiz = useCallback(async (moduleId: number, answers: QuizAnswer[], lessonId?: number) => {
    const result = await api.submitQuiz(moduleId, answers, lessonId);
    setState(s => ({ ...s, lastQuizResult: result }));
    // Refresh progress
    const progress = await api.getProgress();
    setState(s => ({ ...s, progress }));
    return result;
  }, []);

  const startMockTest = useCallback(async (count?: number) => {
    setLoading('mockTest', true);
    try {
      const test = await api.startMockTest(count);
      setState(s => ({ ...s, currentMockTest: test }));
      return test;
    } finally {
      setLoading('mockTest', false);
    }
  }, [setLoading]);

  const submitMockTest = useCallback(async (testId: string, answers: QuizAnswer[], timeTakenSeconds: number) => {
    const result = await api.submitMockTest(testId, answers, timeTakenSeconds);
    setState(s => ({ ...s, lastMockResult: result, currentMockTest: null }));
    // Refresh progress
    const progress = await api.getProgress();
    setState(s => ({ ...s, progress }));
    return result;
  }, []);

  const loadLeaderboard = useCallback(async (period: 'weekly' | 'alltime' = 'weekly') => {
    setLoading('leaderboard', true);
    try {
      const leaderboard = await api.getLeaderboard(period);
      setState(s => ({ ...s, leaderboard }));
    } finally {
      setLoading('leaderboard', false);
    }
  }, [setLoading]);

  return (
    <AppContext.Provider value={{
      ...state,
      loadModules,
      loadProgress,
      loadModuleContent,
      completeLesson,
      submitQuiz,
      startMockTest,
      submitMockTest,
      loadLeaderboard,
      setLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
