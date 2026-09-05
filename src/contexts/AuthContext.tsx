import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const stored = localStorage.getItem("onekey_session");
    if (stored) {
      try {
        const session = JSON.parse(stored);
        setUser(session.user);
      } catch {
        localStorage.removeItem("onekey_session");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("auth", {
        body: { username, password, action: "login" },
      });

      if (error || !data?.success) {
        console.error("Login failed:", error || data?.error);
        return false;
      }

      const session = {
        user: data.user,
        token: data.token,
      };

      setUser(data.user);
      localStorage.setItem("onekey_session", JSON.stringify(session));
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("onekey_session");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
