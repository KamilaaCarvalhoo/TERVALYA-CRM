
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "SALES";
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token =
        localStorage.getItem("vertice_token") ||
        sessionStorage.getItem("vertice_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch {
        localStorage.removeItem("vertice_token");
        sessionStorage.removeItem("vertice_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function login(
    email: string,
    password: string,
    rememberMe = false
  ) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const token = response.data.token;

    localStorage.removeItem("vertice_token");
    sessionStorage.removeItem("vertice_token");

    if (rememberMe) {
      localStorage.setItem("vertice_token", token);
    } else {
      sessionStorage.setItem("vertice_token", token);
    }

    setUser(response.data.user);
  }

  async function register(
    name: string,
    email: string,
    password: string
  ) {
    await api.post("/auth/register", {
      name,
      email,
      password,
    });

    await login(email, password, true);
  }

  async function logout() {
    try {
      await api.post("/sessions/logout");
    } catch (error) {
      console.error(
        "Não foi possível revogar a sessão no servidor:",
        error
      );
    } finally {
      localStorage.removeItem("vertice_token");
      sessionStorage.removeItem("vertice_token");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
