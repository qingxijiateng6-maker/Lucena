"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { GetAuthMeResponse } from "@/types/api";
import type { SessionUser } from "@/types/auth";
import {
  isFirebaseClientConfigured,
  signInWithGoogleForSessionExchange,
  signOutFirebaseClient,
} from "@/lib/firebase/client";

type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  firebaseConfigured: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getFriendlyAuthErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code);

    if (code === "auth/popup-blocked") {
      return "ブラウザにポップアップがブロックされました。ポップアップを許可してから、もう一度お試しください。";
    }

    if (code === "auth/popup-closed-by-user") {
      return "Googleログインのポップアップが途中で閉じられました。もう一度お試しください。";
    }

    if (code === "auth/cancelled-popup-request") {
      return "Googleログイン処理がキャンセルされました。もう一度お試しください。";
    }

    if (code === "auth/unauthorized-domain") {
      return "このドメインは Firebase Authentication の承認済みドメインに登録されていません。";
    }
  }

  return error instanceof Error ? error.message : "ログインに失敗しました。";
}

async function fetchMe() {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("認証状態の取得に失敗しました。");
  }

  return (await response.json()) as GetAuthMeResponse;
}

async function exchangeSession(idToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(data?.error?.message || "Google login failed.");
  }
}

function applyAuthSnapshot(
  data: GetAuthMeResponse,
  setUser: (user: SessionUser | null) => void,
  setStatus: (status: AuthStatus) => void,
) {
  if (data.authenticated) {
    setUser(data.user);
    setStatus("authenticated");
    return;
  }

  setUser(null);
  setStatus("guest");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const firebaseConfigured = isFirebaseClientConfigured();

  const refresh = useCallback(async () => {
    try {
      const data = await fetchMe();
      applyAuthSnapshot(data, setUser, setStatus);
    } catch (refreshError) {
      setUser(null);
      setStatus("guest");
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "認証状態の取得に失敗しました。",
      );
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [refresh]);

  const login = useCallback(async () => {
    setError(null);

    if (!firebaseConfigured) {
      setError("Firebase client configuration is missing.");
      return;
    }

    setStatus("loading");

    try {
      const idToken = await signInWithGoogleForSessionExchange();
      await exchangeSession(idToken);
      await refresh();
    } catch (loginError) {
      setStatus("guest");
      setError(getFriendlyAuthErrorMessage(loginError));
    }
  }, [firebaseConfigured, refresh]);

  const logout = useCallback(async () => {
    setError(null);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      await signOutFirebaseClient();
      await refresh();
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "ログアウトに失敗しました。",
      );
    }
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      firebaseConfigured,
      error,
      login,
      logout,
      refresh,
    }),
    [error, firebaseConfigured, login, logout, refresh, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
