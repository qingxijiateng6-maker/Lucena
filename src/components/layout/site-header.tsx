"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/leggere", label: "Leggere" },
  { href: "/ascoltare", label: "Ascoltare" },
  { href: "/help", label: "使い方" },
];

function getAvatarFallback(name: string) {
  const initial = name.trim().charAt(0);
  return initial ? initial.toUpperCase() : "U";
}

export function SiteHeader() {
  const pathname = usePathname();
  const { status, user, error, login, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(250,250,248,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-[0.12em]">
            Italian Learning App
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm text-[var(--muted)] transition",
                  pathname === item.href && "bg-white text-[var(--foreground)] shadow-sm",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-end gap-2">
          {status === "authenticated" && user ? (
            <details className="relative">
              <summary
                aria-label={`${user.displayName} のメニューを開く`}
                className="list-none rounded-full border border-[var(--line)] bg-white p-0 text-sm font-medium text-[var(--foreground)] shadow-sm transition hover:border-[var(--foreground)]/25 focus-visible:outline-none"
              >
                <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={`${user.displayName} のプロフィール画像`}
                      className="h-full w-full object-cover"
                      width={44}
                      height={44}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-[var(--panel-soft)] text-sm font-semibold">
                      {getAvatarFallback(user.displayName)}
                    </span>
                  )}
                </span>
              </summary>

              <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-[var(--line)] bg-white p-2 shadow-lg">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {user.displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-[var(--line)]" />
                <Link
                  href="/history"
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-[var(--panel-soft)]"
                >
                  学習履歴
                </Link>
                <Link
                  href="/notes"
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-[var(--panel-soft)]"
                >
                  メモ
                </Link>
                <button
                  className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--panel-soft)]"
                  onClick={() => void logout()}
                  type="button"
                >
                  ログアウト
                </button>
              </div>
            </details>
          ) : (
            <button
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium"
              onClick={() => void login()}
              type="button"
            >
              {status === "loading" ? "認証中..." : "Googleログイン"}
            </button>
          )}

          {error ? (
            <p
              role="alert"
              className="max-w-xs rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-right text-xs leading-5 text-red-700"
            >
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
