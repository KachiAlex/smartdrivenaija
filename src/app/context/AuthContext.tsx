import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, type User } from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  requestOTP: (phone: string, email?: string, deliveryMethod?: 'sms' | 'email' | 'both') => Promise<{ expiresIn: number; sentVia: string[]; _dev_otp?: string }>;
  verifyOTP: (phone: string, code: string, email?: string) => Promise<void>;
  registerInit: (phone: string, email?: string, deliveryMethod?: 'sms' | 'email' | 'both') => Promise<{ expiresIn: number; sentVia: string[]; _dev_otp?: string }>;
  registerVerifyOTP: (phone: string, code: string, email?: string) => Promise<{ tempToken: string }>;
  registerComplete: (tempToken: string, password: string, fullName: string, state?: string) => Promise<void>;
  requestPasswordReset: (phone: string, email?: string, deliveryMethod?: 'sms' | 'email' | 'both') => Promise<{ expiresIn: number; _dev_otp?: string }>;
  confirmPasswordReset: (phone: string, code: string, newPassword: string, email?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isNewUser: false,
  });

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      if (!api.isAuthenticated()) {
        setState(s => ({ ...s, isLoading: false }));
        return;
      }

      try {
        const user = await api.getProfile();
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          isNewUser: !user.onboardingCompleted,
        });
      } catch {
        api.clearTokens();
        setState({ user: null, isAuthenticated: false, isLoading: false, isNewUser: false });
      }
    }

    restoreSession();

    // Listen for token expiry events
    const handleExpired = () => {
      setState({ user: null, isAuthenticated: false, isLoading: false, isNewUser: false });
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await api.login(identifier, password);
    api.setTokens(result.accessToken, result.refreshToken);
    setState({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
      isNewUser: !result.user?.onboardingCompleted,
    });
  }, []);

  const requestOTP = useCallback(async (phone: string, email?: string, deliveryMethod?: 'sms' | 'email' | 'both') => {
    const result = await api.requestOTP(phone, email, deliveryMethod);
    return { expiresIn: result.expiresIn, sentVia: result.sentVia, _dev_otp: result._dev_otp };
  }, []);

  const verifyOTP = useCallback(async (phone: string, code: string, email?: string) => {
    const result = await api.verifyOTP(phone, code, email);
    api.setTokens(result.accessToken, result.refreshToken);
    setState({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
      isNewUser: !result.user?.onboardingCompleted,
    });
  }, []);

  const registerInit = useCallback(async (phone: string, email?: string, deliveryMethod?: 'sms' | 'email' | 'both') => {
    const result = await api.registerInit(phone, email, deliveryMethod);
    return { expiresIn: result.expiresIn, sentVia: result.sentVia, _dev_otp: result._dev_otp };
  }, []);

  const registerVerifyOTP = useCallback(async (phone: string, code: string, email?: string) => {
    const result = await api.registerVerifyOTP(phone, code, email);
    return { tempToken: result.tempToken };
  }, []);

  const registerComplete = useCallback(async (tempToken: string, password: string, fullName: string, state?: string) => {
    const result = await api.registerComplete(tempToken, password, fullName, state);
    api.setTokens(result.accessToken, result.refreshToken);
    setState({
      user: result.user,
      isAuthenticated: true,
      isLoading: false,
      isNewUser: !result.user?.onboardingCompleted,
    });
  }, []);

  const requestPasswordReset = useCallback(async (phone: string, email?: string, deliveryMethod?: 'sms' | 'email' | 'both') => {
    const result = await api.requestPasswordReset(phone, email, deliveryMethod);
    return { expiresIn: result.expiresIn, _dev_otp: result._dev_otp };
  }, []);

  const confirmPasswordReset = useCallback(async (phone: string, code: string, newPassword: string, email?: string) => {
    await api.confirmPasswordReset(phone, code, newPassword, email);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false, isNewUser: false });
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setState(s => ({
      ...s,
      user: s.user ? { ...s.user, ...data } : null,
    }));
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const user = await api.getProfile();
      setState(s => ({ ...s, user, isNewUser: !user.onboardingCompleted }));
    } catch {
      // Silently fail — profile will be stale
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, requestOTP, verifyOTP, registerInit, registerVerifyOTP, registerComplete, requestPasswordReset, confirmPasswordReset, changePassword, logout, updateUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
