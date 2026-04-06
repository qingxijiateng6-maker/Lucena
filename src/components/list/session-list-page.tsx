"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GetSessionsResponse } from "@/types/api";
import type { SessionType } from "@/types/session";
import { LoginPromptModal } from "@/components/auth/login-prompt-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { routeSegmentFromSessionType, sessionTypeLabel } from "@/lib/utils/session";

export function SessionListPage({ sessionType }: { sessionType: SessionType }) {
  const [data, setData] = useState<GetSessionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptHref, setPromptHref] = useState<string | null>(null);
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/sessions?type=${sessionType}`, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("一覧の取得に失敗しました。");
        }

        setData((await response.json()) as GetSessionsResponse);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "一覧の取得に失敗しました。",
        );
      }
    };

    void load();
    return () => controller.abort();
  }, [sessionType]);

  return (
    <>
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Session List
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          {sessionTypeLabel(sessionType)}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
          公開中のセッションを番号順に並べています。未ログインでも開始できますが、履歴とメモ、途中保存はログイン後に有効になります。
        </p>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {!data && !error ? <LoadingState label="セッションを読み込んでいます..." /> : null}
        {error ? <ErrorState message={error} /> : null}
        {data?.items.map((item) => {
          const href = `/${routeSegmentFromSessionType(sessionType)}/${item.sessionNumber}`;
          return (
            <Link
              key={item.sessionId}
              className="group rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              href={href}
              onClick={(event) => {
                if (status === "authenticated") {
                  return;
                }

                event.preventDefault();
                setPromptHref(href);
              }}
            >
              <div className="relative h-44 overflow-hidden rounded-[22px] bg-[var(--accent)]">
                {item.heroIllustrationPath ? (
                  <Image
                    alt={item.titleIt}
                    className="object-cover"
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    src={item.heroIllustrationPath}
                  />
                ) : null}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Session {item.sessionNumber.toString().padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                    {item.titleIt}
                  </h2>
                </div>
                <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
                  {item.isLearned ? "学習済み" : "未学習"}
                </span>
              </div>
            </Link>
          );
        })}
      </section>

      <LoginPromptModal
        onClose={() => setPromptHref(null)}
        onContinue={() => {
          if (promptHref) {
            router.push(promptHref);
          }
          setPromptHref(null);
        }}
        open={Boolean(promptHref)}
      />
    </>
  );
}
