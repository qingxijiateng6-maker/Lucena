"use client";

import { useAuth } from "@/components/auth/auth-provider";

interface LoginPromptModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  onContinue?: () => void;
}

export function LoginPromptModal({
  open,
  title = "ログインすると保存できます",
  description = "学習履歴、メモ、途中保存はログイン後に使えます。今は閉じてそのまま学習を続けることもできます。",
  onClose,
  onContinue,
}: LoginPromptModalProps) {
  const { login, error, firebaseConfigured } = useAuth();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Secure Session
        </p>
        <h2 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          {description}
        </p>
        {!firebaseConfigured ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Firebase の設定がまだないため、この環境では Google ログインを開始できません。
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white"
            onClick={() => void login()}
            type="button"
          >
            Googleでログイン
          </button>
          <button
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
            onClick={() => {
              onClose();
              onContinue?.();
            }}
            type="button"
          >
            このまま続ける
          </button>
        </div>
      </div>
    </div>
  );
}
