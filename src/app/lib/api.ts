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

  // ── Auth (Optimized Flow) ─────────────────────────────────
  // Standard login: email/phone + password
  async login(identifier: string, password: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
      skipAuth: true,
    });
  }

  // OTP login fallback (for passwordless users)
  async requestLoginOTP(phone: string, email?: string, deliveryMethod: 'sms' | 'email' | 'both' = 'sms') {
    return this.request<{ message: string; expiresIn: number; sentVia: string[]; _dev_otp?: string }>(
      '/auth/login/otp-request',
      { method: 'POST', body: JSON.stringify({ phone, email, deliveryMethod }), skipAuth: true }
    );
  }

  async verifyLoginOTP(phone: string, code: string, email?: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login/otp-verify', {
      method: 'POST',
      body: JSON.stringify({ phone, email, code }),
      skipAuth: true,
    });
  }

  // Registration flow: init → verify → complete
  async registerInit(phone: string, email?: string, deliveryMethod: 'sms' | 'email' | 'both' = 'sms') {
    return this.request<{ message: string; expiresIn: number; sentVia: string[]; _dev_otp?: string }>(
      '/auth/register/init',
      { method: 'POST', body: JSON.stringify({ phone, email, deliveryMethod }), skipAuth: true }
    );
  }

  async registerVerifyOTP(phone: string, code: string, email?: string) {
    return this.request<{ tempToken: string; message: string }>(
      '/auth/register/verify-otp',
      { method: 'POST', body: JSON.stringify({ phone, email, code }), skipAuth: true }
    );
  }

  async registerComplete(tempToken: string, password: string, fullName: string, state?: string) {
    return this.request<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/register/complete', {
      method: 'POST',
      body: JSON.stringify({ tempToken, password, fullName, state }),
      skipAuth: true,
    });
  }

  // Password reset flow
  async requestPasswordReset(phone: string, email?: string, deliveryMethod: 'sms' | 'email' | 'both' = 'sms') {
    return this.request<{ message: string; expiresIn: number; _dev_otp?: string }>(
      '/auth/password-reset/request',
      { method: 'POST', body: JSON.stringify({ phone, email, deliveryMethod }), skipAuth: true }
    );
  }

  async confirmPasswordReset(phone: string, code: string, newPassword: string, email?: string) {
    return this.request<{ message: string }>(
      '/auth/password-reset/confirm',
      { method: 'POST', body: JSON.stringify({ phone, email, code, newPassword }), skipAuth: true }
    );
  }

  // Authenticated password change
  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Legacy OTP endpoints (kept for backward compatibility during transition)
  async requestOTP(phone: string, email?: string, deliveryMethod: 'sms' | 'email' | 'both' = 'sms') {
    // Redirect to new login OTP endpoint
    return this.requestLoginOTP(phone, email, deliveryMethod);
  }

  async verifyOTP(phone: string, code: string, email?: string) {
    // Redirect to new login OTP verify endpoint
    return this.verifyLoginOTP(phone, code, email);
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
  async getLeaderboard(period: 'weekly' | 'alltime' | 'score' = 'weekly') {
    return this.request<LeaderboardResponse>(`/leaderboard?period=${period}`);
  }

  // ── Wallet ───────────────────────────────────────────────
  async getDocuments() {
    return this.request<DriverDocument[]>('/wallet');
  }

  async uploadDocument(file: File, documentType: string, documentName: string, expiryDate?: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('documentName', documentName);
    if (expiryDate) {
      formData.append('expiryDate', expiryDate);
    }

    const response = await fetch(`${API_BASE}/wallet/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new ApiError(error.error || 'Upload failed', response.status, error.code);
    }

    return response.json();
  }

  async updateDocument(documentId: number, data: { expiryDate?: string; documentName?: string }) {
    return this.request<DriverDocument>(`/wallet/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(documentId: number) {
    return this.request(`/wallet/${documentId}`, {
      method: 'DELETE',
    });
  }

  async getComplianceStatus() {
    return this.request<ComplianceStatus>('/wallet/compliance');
  }

  // ── Reminders ───────────────────────────────────────────
  async getReminders(): Promise<Reminder[]> {
    return this.request<Reminder[]>('/reminders');
  }

  async markReminderAsRead(id: number): Promise<Reminder> {
    return this.request<Reminder>(`/reminders/${id}/read`, {
      method: 'PUT',
    });
  }

  async deleteReminder(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/reminders/${id}`, {
      method: 'DELETE',
    });
  }

  async checkExpiryReminders(): Promise<{ message: string; remindersCreated: number; reminders: Reminder[] }> {
    return this.request<{ message: string; remindersCreated: number; reminders: Reminder[] }>('/reminders/check-expiry', {
      method: 'POST',
    });
  }

  // ── Referrals ───────────────────────────────────────────
  async getMyReferral(): Promise<ReferralInfo> {
    return this.request<ReferralInfo>('/referrals/my-referral');
  }

  async validateReferralCode(referralCode: string): Promise<{ valid: boolean; referrer?: { id: number; name: string } }> {
    return this.request<{ valid: boolean; referrer?: { id: number; name: string } }>('/referrals/validate', {
      method: 'POST',
      body: JSON.stringify({ referral_code: referralCode }),
    });
  }

  async createReferral(referrerId: number, referredUserId: number, referralCode: string): Promise<Referral> {
    return this.request<Referral>('/referrals/create', {
      method: 'POST',
      body: JSON.stringify({ referrer_id: referrerId, referred_user_id: referredUserId, referral_code: referralCode }),
    });
  }

  async grantReferralReward(id: number, rewardType: string): Promise<Referral> {
    return this.request<Referral>(`/referrals/${id}/grant-reward`, {
      method: 'PUT',
      body: JSON.stringify({ reward_type: rewardType }),
    });
  }

  async getReferralLeaderboard(): Promise<{ id: number; name: string; xp: number; total_referrals: number; completed_referrals: number }[]> {
    return this.request<{ id: number; name: string; xp: number; total_referrals: number; completed_referrals: number }[]>('/referrals/leaderboard');
  }

  // ── Rewards ───────────────────────────────────────────
  async getMyRewards(): Promise<Reward[]> {
    return this.request<Reward[]>('/rewards/my-rewards');
  }

  async getMyBadges(): Promise<Badge[]> {
    return this.request<Badge[]>('/rewards/my-badges');
  }

  async getAllBadges(): Promise<Badge[]> {
    return this.request<Badge[]>('/rewards/badges');
  }

  async grantReward(data: { user_id: number; reward_type: string; reward_name: string; reward_value?: number; source_type?: string; source_id?: number; expires_at?: string }): Promise<Reward> {
    return this.request<Reward>('/rewards/grant', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async awardBadge(userId: number, badgeSlug: string): Promise<{ badge: Badge; user_badge: any; xp_granted: number }> {
    return this.request<{ badge: Badge; user_badge: any; xp_granted: number }>('/rewards/badges/award', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, badge_slug: badgeSlug }),
    });
  }

  async checkAndAwardBadges(): Promise<{ awarded_badges: Badge[] }> {
    return this.request<{ awarded_badges: Badge[] }>('/rewards/check-badges', {
      method: 'POST',
    });
  }

  async getPremiumStatus(): Promise<{ is_premium: boolean; premium_expires_at: string | null }> {
    return this.request<{ is_premium: boolean; premium_expires_at: string | null }>('/rewards/premium-status');
  }

  // ── Offences (Fine Assistant) ───────────────────────────────────────────
  async searchOffences(params?: { q?: string; category?: string; severity?: string }): Promise<Offence[]> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<Offence[]>(`/offences/search${queryString ? `?${queryString}` : ''}`);
  }

  async getOffence(code: string): Promise<Offence> {
    return this.request<Offence>(`/offences/${code}`);
  }

  async getOffenceCategories(): Promise<string[]> {
    return this.request<string[]>('/offences/meta/categories');
  }

  async getPenaltyInfo(code: string): Promise<PenaltyInfo> {
    return this.request<PenaltyInfo>(`/offences/${code}/penalty`);
  }

  async getLegalGuidance(code: string): Promise<LegalGuidance> {
    return this.request<LegalGuidance>(`/offences/${code}/guidance`);
  }

  async getAllOffences(params?: { page?: number; limit?: number; category?: string; severity?: string }): Promise<{
    offences: Offence[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<{ offences: Offence[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`/offences${queryString ? `?${queryString}` : ''}`);
  }

  // ── Driver Score ───────────────────────────────────────────
  async getDriverScore(): Promise<{
    driverScore: number;
    scoreBreakdown: { modules: number; quizzes: number; streak: number; xp: number };
    details: { modulesCompleted: number; totalModules: number; avgQuizScore: number; streakCurrent: number; xpTotal: number };
  }> {
    return this.request<{
      driverScore: number;
      scoreBreakdown: { modules: number; quizzes: number; streak: number; xp: number };
      details: { modulesCompleted: number; totalModules: number; avgQuizScore: number; streakCurrent: number; xpTotal: number };
    }>('/user/driver-score');
  }

  // ── Hazards ───────────────────────────────────────────
  async reportHazard(data: {
    user_id: number;
    hazard_type: string;
    description: string;
    latitude: number;
    longitude: number;
    location_address?: string;
    image_url?: string;
    severity?: string;
  }): Promise<Hazard> {
    return this.request<Hazard>('/hazards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getHazards(params?: { hazard_type?: string; severity?: string }): Promise<Hazard[]> {
    const queryString = new URLSearchParams(params as any).toString();
    return this.request<Hazard[]>(`/hazards${queryString ? `?${queryString}` : ''}`);
  }

  async voteOnHazard(hazardId: number, userId: number, voteType: 'upvote' | 'downvote'): Promise<Hazard> {
    return this.request<Hazard>(`/hazards/${hazardId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, vote_type: voteType }),
    });
  }

  async resolveHazard(hazardId: number): Promise<Hazard> {
    return this.request<Hazard>(`/hazards/${hazardId}/resolve`, {
      method: 'PUT',
    });
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

export interface DriverDocument {
  id: number;
  document_type: string;
  document_name: string;
  expiry_date: string | null;
  file_url: string;
  created_at: string;
}

export interface ComplianceStatus {
  totalDocuments: number;
  validDocuments: number;
  expiredDocuments: number;
  expiringSoon: number;
  compliancePercentage: number;
}

export interface Reminder {
  id: number;
  user_id: number;
  document_id: number | null;
  reminder_type: string;
  days_before_expiry: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  document_type?: string;
  document_name?: string;
  expiry_date?: string;
}

export interface ReferralStats {
  pending_referrals: number;
  completed_referrals: number;
  rewarded_referrals: number;
}

export interface Referral {
  id: number;
  referrer_id: number;
  referred_user_id: number | null;
  referral_code: string;
  status: string;
  reward_type: string | null;
  reward_granted: boolean;
  created_at: string;
  completed_at: string | null;
  referred_user_name?: string;
}

export interface ReferralInfo {
  referral_code: string;
  stats: ReferralStats;
  recent_referrals: Referral[];
}

export interface Reward {
  id: number;
  user_id: number;
  reward_type: string;
  reward_name: string;
  reward_value: number | null;
  granted_at: string;
  expires_at: string | null;
  source_type: string | null;
  source_id: number | null;
  is_active: boolean;
}

export interface Badge {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  requirement_type: string;
  requirement_value: number;
  reward_xp: number;
  earned?: boolean;
  earned_at?: string;
}

export interface Offence {
  id: number;
  code: string;
  title: string;
  description: string | null;
  category: string;
  penalty_amount: number | null;
  penalty_points: number | null;
  section: string | null;
  severity: string;
  is_active: boolean;
}

export interface PenaltyInfo {
  offence_code: string;
  offence_title: string;
  penalty_amount: number | null;
  penalty_points: number | null;
  severity: string;
  regulation_section: string | null;
  payment_deadline: string;
  payment_methods: string[];
  consequences: {
    points_accumulation: string;
    non_payment: string;
    license_suspension: string;
  };
}

export interface LegalGuidance {
  offence_summary: string | null;
  legal_basis: string;
  severity_level: string;
  immediate_actions: string[];
  legal_rights: string[];
  next_steps: string[];
  resources: string[];
}

export interface Hazard {
  id: number;
  user_id: number;
  hazard_type: string;
  description: string;
  latitude: number;
  longitude: number;
  location_address: string | null;
  image_url: string | null;
  status: string;
  severity: string;
  upvotes: number;
  downvotes: number;
  reported_at: string;
  expires_at: string;
  resolved_at: string | null;
  reporter_name?: string;
}

// Singleton instance
export const api = new ApiClient();
