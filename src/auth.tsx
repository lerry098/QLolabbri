import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { api } from "./api";
import type { User } from "../shared/models";
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<unknown>;
  clear: () => void;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["session"],
    queryFn: api.me,
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  return (
    <AuthContext.Provider
      value={{
        user: query.data?.user || null,
        loading: query.isPending,
        error: query.error,
        refresh: () => client.invalidateQueries({ queryKey: ["session"] }),
        clear: () => {
          client.clear();
          client.setQueryData(["session"], { user: null });
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider required");
  return context;
}
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, error, refresh } = useAuth();
  if (loading)
    return (
      <p className="page-message" role="status">
        Memeriksa sesi…
      </p>
    );
  if (error)
    return (
      <div className="page-message" role="alert">
        {error.message}{" "}
        <button className="button" onClick={() => void refresh()}>
          Coba lagi
        </button>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
