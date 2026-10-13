import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, apiErrorMessage, clearToken, getToken, setToken } from "./api";
import { registerForPushNotifications } from "./push-notifications";
import type { Role, User } from "./types";

interface TutorProfileStatus {
  id: string;
  isVerified: boolean;
  isActive: boolean;
}

interface AuthContextValue {
  user: User | null;
  tutorProfile: TutorProfileStatus | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fields: { name: string; email: string; password: string; role: Role; phone?: string }) => Promise<{ emailSent: boolean }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfileStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setTutorProfile(null);
      return;
    }
    try {
      const res = await api.get<{ user: User; tutorProfile: TutorProfileStatus | null }>("/api/auth/me");
      setUser(res.user);
      setTutorProfile(res.tutorProfile);
    } catch {
      await clearToken();
      setUser(null);
      setTutorProfile(null);
    }
  }

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, []);

  // Register this device for push notifications once we know who's signed in.
  // Fire-and-forget: registration failures (no EAS project, permission denied,
  // simulator) are handled quietly inside registerForPushNotifications itself.
  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user?.id]);

  async function login(email: string, password: string) {
    const res = await api.post<{ token: string; user: User }>("/api/auth/login", { email, password }, { auth: false });
    await setToken(res.token);
    setUser(res.user);
    await refreshMe();
  }

  async function register(fields: { name: string; email: string; password: string; role: Role; phone?: string }) {
    const res = await api.post<{ emailSent: boolean }>("/api/auth/register", fields, { auth: false });
    return res;
  }

  async function verifyEmail(email: string, code: string) {
    const res = await api.post<{ token: string; user: User }>("/api/auth/verify-email", { email, code }, { auth: false });
    await setToken(res.token);
    setUser(res.user);
    await refreshMe();
  }

  async function resendCode(email: string) {
    await api.post("/api/auth/resend-verification", { email }, { auth: false });
  }

  async function forgotPassword(email: string) {
    await api.post("/api/auth/forgot-password", { email }, { auth: false });
  }

  async function resetPassword(email: string, code: string, newPassword: string) {
    const res = await api.post<{ token: string; user: User }>(
      "/api/auth/reset-password",
      { email, code, newPassword },
      { auth: false },
    );
    await setToken(res.token);
    setUser(res.user);
    await refreshMe();
  }

  async function logout() {
    await clearToken();
    setUser(null);
    setTutorProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        tutorProfile,
        loading,
        login,
        register,
        verifyEmail,
        resendCode,
        forgotPassword,
        resetPassword,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { apiErrorMessage };