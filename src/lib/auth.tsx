import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "guest" | "admin";

export type AuthUser = {
  role: Role;
  name?: string;
  phone?: string;
  email?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loginGuest: (profile: { name: string; phone: string; email?: string }) => void;
  loginAdmin: (password: string) => boolean;
  logout: () => void;
};

const STORAGE_KEY = "mayrig.auth.v1";
const ADMIN_PASSWORD = "manager"; // demo only

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const loginGuest: AuthContextType["loginGuest"] = (profile) => {
    persist({ role: "guest", ...profile });
  };

  const loginAdmin: AuthContextType["loginAdmin"] = (password) => {
    if (password !== ADMIN_PASSWORD) return false;
    persist({ role: "admin", name: "Manager" });
    return true;
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, loginGuest, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const ADMIN_PASSWORD_HINT = "manager";
