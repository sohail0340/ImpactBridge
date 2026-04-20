import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  fetchMe,
  login as loginApi,
  logout as logoutApi,
  signup as signupApi,
  type AuthUser,
  type SignupInput,
} from "@/services/auth";

const USER_CACHE_KEY = "impactbridge:user";

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: AuthUser | null) {
  if (user) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_CACHE_KEY);
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  signup: (input: SignupInput) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Restore from localStorage IMMEDIATELY so refresh doesn't flash "not logged in"
  const [user, setUser] = useState<AuthUser | null>(() => readCachedUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fresh = await fetchMe();
      if (cancelled) return;
      if (fresh) {
        setUser(fresh);
        writeCachedUser(fresh);
      } else {
        // Token missing/invalid — clear cache
        setUser(null);
        writeCachedUser(null);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const login = async (email: string, password: string) => {
    const u = await loginApi({ email, password });
    setUser(u);
    writeCachedUser(u);
    return u;
  };

  const signup = async (input: SignupInput) => {
    const u = await signupApi(input);
    setUser(u);
    writeCachedUser(u);
    return u;
  };

  const logout = () => {
    logoutApi();
    setUser(null);
    writeCachedUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
