import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { UsuarioConDetalles } from "@shared/schema";

interface AuthContextType {
  user: UsuarioConDetalles | null;
  isLoading: boolean;
  login: (rut: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioConDetalles | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("gvclassroom-user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("gvclassroom-user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (rut: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut, password }),
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem("gvclassroom-user", JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("gvclassroom-user");
  };

  const hasPermission = (permiso: string): boolean => {
    if (!user?.perfil?.permisos) return false;
    try {
      const permisos = JSON.parse(user.perfil.permisos) as string[];
      return permisos.includes(permiso) || permisos.includes("*");
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
