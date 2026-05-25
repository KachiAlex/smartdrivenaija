const BASE = '/api/admin';

function headers(token?: string) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function req<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any).error || `HTTP ${res.status}`);
  return data as T;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface User {
  id: string;
  phone: string | null;
  email: string | null;
  full_name: string | null;
  role: string;
  is_premium: boolean;
  xp_total: number;
  streak_current: number;
  onboarding_completed: boolean;
  has_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  totalUsers: number;
  premiumUsers: number;
  newToday: number;
  otpRequestsToday: number;
  activeRefreshTokens: number;
  roleBreakdown: { role: string; count: string }[];
  signupsLast7Days: { date: string; count: string }[];
}

export interface Module {
  id: number;
  slug: string;
  title_en: string;
  description_en: string | null;
  icon: string;
  sort_order: number;
  is_free: boolean;
  is_premium: boolean;
  estimated_minutes: number;
  xp_reward: number;
  lesson_count?: number;
  question_count?: number;
}

export interface Question {
  id: number;
  module_id: number;
  module_title?: string;
  lesson_id: number | null;
  topic_tag: string;
  question_type: string;
  question_en: string;
  options_en: string[];
  correct_answer: number;
  explanation_en: string | null;
  difficulty: number;
  is_mock_test_eligible: boolean;
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const api = {
  login: (email: string, password: string) =>
    req<{ token: string; user: AdminUser }>(`${BASE}/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ email, password }),
    }),

  stats: (token: string) =>
    req<Stats>(`${BASE}/stats`, { headers: headers(token) }),

  users: (token: string, params: { page?: number; search?: string; role?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.search) q.set('search', params.search);
    if (params.role) q.set('role', params.role);
    return req<{ users: User[]; pagination: Pagination }>(`${BASE}/users?${q}`, { headers: headers(token) });
  },

  getUser: (token: string, id: string) =>
    req<User & { active_sessions: number; premium_expires_at: string | null; streak_longest: number; preferred_language: string }>(`${BASE}/users/${id}`, { headers: headers(token) }),

  updateUser: (token: string, id: string, body: { role?: string; isPremium?: boolean; premiumExpiresAt?: string }) =>
    req<{ message: string; user: User }>(`${BASE}/users/${id}`, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify(body),
    }),

  deleteUser: (token: string, id: string) =>
    req<{ message: string }>(`${BASE}/users/${id}`, { method: 'DELETE', headers: headers(token) }),

  revokeSessions: (token: string, id: string) =>
    req<{ message: string; count: number }>(`${BASE}/users/${id}/sessions`, { method: 'DELETE', headers: headers(token) }),

  // ── Content ──────────────────────────────────────────────────────────────
  getModules: (token: string) =>
    req<Module[]>(`${BASE}/content/modules`, { headers: headers(token) }),

  createModule: (token: string, body: Partial<Module>) =>
    req<Module>(`${BASE}/content/modules`, { method: 'POST', headers: headers(token), body: JSON.stringify(body) }),

  updateModule: (token: string, id: number, body: Partial<Module>) =>
    req<Module>(`${BASE}/content/modules/${id}`, { method: 'PATCH', headers: headers(token), body: JSON.stringify(body) }),

  deleteModule: (token: string, id: number) =>
    req<{ message: string }>(`${BASE}/content/modules/${id}`, { method: 'DELETE', headers: headers(token) }),

  getQuestions: (token: string, params: { module_id?: number; page?: number; search?: string; mock_only?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (params.module_id) q.set('module_id', String(params.module_id));
    if (params.page) q.set('page', String(params.page));
    if (params.search) q.set('search', params.search);
    if (params.mock_only) q.set('mock_only', 'true');
    return req<{ questions: Question[]; pagination: Pagination }>(`${BASE}/content/questions?${q}`, { headers: headers(token) });
  },

  createQuestion: (token: string, body: Partial<Question>) =>
    req<Question>(`${BASE}/content/questions`, { method: 'POST', headers: headers(token), body: JSON.stringify(body) }),

  updateQuestion: (token: string, id: number, body: Partial<Question>) =>
    req<Question>(`${BASE}/content/questions/${id}`, { method: 'PATCH', headers: headers(token), body: JSON.stringify(body) }),

  deleteQuestion: (token: string, id: number) =>
    req<{ message: string }>(`${BASE}/content/questions/${id}`, { method: 'DELETE', headers: headers(token) }),

  bulkImportQuestions: (token: string, questions: Partial<Question>[]) =>
    req<{ message: string; inserted: number }>(`${BASE}/content/questions/bulk`, { method: 'POST', headers: headers(token), body: JSON.stringify({ questions }) }),
};
