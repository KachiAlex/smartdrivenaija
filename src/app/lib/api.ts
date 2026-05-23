const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!res.ok) {
        this.clearTokens();
        return false;
      }

      const data = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const { skipAuth, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

    // Auto-refresh on 401
    if (res.status === 401 && !skipAuth && this.refreshToken) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshAccessToken();
      }
      const refreshed = await this.refreshPromise;
      this.refreshPromise = null;

      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
      } else {
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error('Session expired');
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(error.error || 'Request failed', res.status, error.code);
    }

    return res.json();
  }

  // ── Auth ──────────────────────────────────────────────────
  async requestOTP(phone: string, email?: string, deliveryMethod: 'sms' | 'email' | 'both' = 'sms') {
    return this.request<{ message: string; expiresIn: number; sentVia: string[]; _dev_otp?: string }>(
      '/auth/otp/request',
      { method: 'POST', body: JSON.stringify({ phone, email, deliveryMethod }), skipAuth: true }
    );
  }

  async verifyOTP(phone: string, code: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: User;
      isNewUser: boolean;
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
      skipAuth: true,
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    } finally {
      this.clearTokens();
    }
  }

  // ── User ──────────────────────────────────────────────────
  async getProfile() {
    return this.request<User>('/user/profile');
  }

  async updateProfile(data: { fullName?: string; preferredLanguage?: string }) {
    return this.request<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async completeOnboarding(data: { fullName?: string; preferredLanguage?: string }) {
    return this.request('/user/onboarding-complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ── Modules ───────────────────────────────────────────────
  async getModules() {
    return this.request<Module[]>('/modules');
  }

  async getModuleContent(moduleId: number) {
    return this.request<ModuleContent>(`/modules/${moduleId}/content`);
  }

  // ── Progress ──────────────────────────────────────────────
  async getProgress() {
    return this.request<UserProgress>('/progress');
  }

  async completeLesson(lessonId: number, timeSpentSeconds: number) {
    return this.request<LessonCompleteResult>('/progress/lesson-complete', {
      method: 'POST',
      body: JSON.stringify({ lessonId, timeSpentSeconds }),
    });
  }

  // ── Quiz ──────────────────────────────────────────────────
  async getQuizQuestions(moduleId: number, limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<{ moduleId: number; questions: Question[]; totalQuestions: number }>(
      `/quiz/${moduleId}${params}`
    );
  }

  async submitQuiz(moduleId: number, answers: QuizAnswer[], lessonId?: number) {
    return this.request<QuizResult>(`/quiz/${moduleId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, lessonId, startedAt: new Date() }),
    });
  }

  // ── Mock Test ─────────────────────────────────────────────
  async startMockTest(count?: number) {
    const params = count ? `?count=${count}` : '';
    return this.request<MockTestStart>(`/mock-test/start${params}`, { method: 'POST' });
  }

  async submitMockTest(testId: string, answers: QuizAnswer[], timeTakenSeconds: number) {
    return this.request<MockTestResult>(`/mock-test/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, timeTakenSeconds }),
    });
  }

  async getMockTestHistory() {
    return this.request<MockTestHistoryItem[]>('/mock-test/history');
  }

  // ── Leaderboard ───────────────────────────────────────────
  async getLeaderboard(period: 'weekly' | 'alltime' = 'weekly') {
    return this.request<LeaderboardResponse>(`/leaderboard?period=${period}`);
  }
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ── Types ────────────────────────────────────────────────────
export interface User {
  id: string;
  phone: string;
  fullName: string | null;
  role: string;
  preferredLanguage: string;
  isPremium: boolean;
  xpTotal: number;
  streakCurrent: number;
  streakLongest?: number;
  onboardingCompleted: boolean;
  createdAt?: string;
}

export interface Module {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  icon: string;
  sortOrder: number;
  isFree: boolean;
  isPremium: boolean;
  estimatedMinutes: number;
  xpReward: number;
  status: string;
  isLocked: boolean;
  progressPercent: number;
  lessonsCompleted: number;
  totalLessons: number;
}

export interface Lesson {
  id: number;
  slug: string;
  title: string;
  content: string;
  audioUrl: string | null;
  sortOrder: number;
  estimatedMinutes: number;
  xpReward: number;
  completed: boolean;
  timeSpentSeconds: number;
}

export interface Question {
  id: number;
  topicTag: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
  difficulty: number;
}

export interface ModuleContent {
  module: {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    icon: string;
    xpReward: number;
  };
  lessons: Lesson[];
  questions: Question[];
}

export interface QuizAnswer {
  questionId: number;
  selected: number;
  timeMs?: number;
}

export interface QuizResult {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  xpEarned: number;
  answers: GradedAnswer[];
}

export interface GradedAnswer {
  question_id: number;
  selected: number;
  correct: boolean;
  topic_tag: string;
  time_ms: number;
  explanation?: string;
}

export interface MockTestStart {
  testId: string;
  startedAt: string;
  timeLimitSeconds: number;
  totalQuestions: number;
  questions: Question[];
}

export interface MockTestResult {
  testId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  xpEarned: number;
  timeTakenSeconds: number;
  topicPerformance: TopicScore[];
  weakAreas: TopicScore[];
  answers: GradedAnswer[];
}

export interface TopicScore {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface MockTestHistoryItem {
  id: string;
  score: number;
  totalQuestions: number;
  percentage: number | null;
  passed: boolean;
  timeTakenSeconds: number;
  xpEarned: number;
  startedAt: string;
  completedAt: string;
}

export interface UserProgress {
  xpTotal: number;
  streakCurrent: number;
  streakLongest: number;
  streakLastActivity: string | null;
  overallPercent: number;
  modulesCompleted: number;
  totalModules: number;
  modules: {
    moduleId: number;
    moduleSlug: string;
    moduleTitle: string;
    status: string;
    progressPercent: number;
    lessonsCompleted: number;
    totalLessons: number;
  }[];
  recentQuizzes: {
    id: string;
    moduleTitle: string;
    score: number;
    totalQuestions: number;
    percentage: number;
    passed: boolean;
    xpEarned: number;
    completedAt: string;
  }[];
  recentMockTests: MockTestHistoryItem[];
  badges: {
    slug: string;
    title: string;
    description: string;
    icon: string;
    xpReward: number;
    earnedAt: string;
  }[];
  xpBreakdown: {
    source: string;
    total: number;
    count: number;
  }[];
}

export interface LessonCompleteResult {
  xpEarned: number;
  lessonsCompleted: number;
  totalLessons: number;
  progressPercent: number;
  moduleCompleted: boolean;
}

export interface LeaderboardResponse {
  period: string;
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  xp: number;
  totalXp: number;
  streak: number;
  isCurrentUser: boolean;
}

// Singleton instance
export const api = new ApiClient();
