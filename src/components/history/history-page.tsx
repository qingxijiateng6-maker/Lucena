"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GetHistoryResponse } from "@/types/api";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { formatDateTime, formatPercent } from "@/lib/utils/format";
import { routeSegmentFromSessionType, sessionTypeLabel } from "@/lib/utils/session";

export function HistoryPageClient() {
  const { status } = useAuth();
  const [data, setData] = useState<GetHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/history", {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("学習履歴の取得に失敗しました。");
        }

        setData((await response.json()) as GetHistoryResponse);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "学習履歴の取得に失敗しました。",
        );
      }
    };

    void load();
    return () => controller.abort();
  }, [status]);

  if (status !== "authenticated") {
    return (
      <section className="mx-auto max-w-2xl rounded-[28px] border border-[var(--line)] bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">学習履歴</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          履歴の保存と復習導線はログイン後に使えます。
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Learning History
        </p>
        <h1 className="mt-3 text-3xl font-semibold">学習履歴</h1>
      </div>

      {!data && !error ? <LoadingState label="履歴を読み込んでいます..." /> : null}
      {error ? <ErrorState message={error} /> : null}
      <div className="space-y-4">
        {data?.items.map((item) => (
          <article
            key={item.attemptId}
            className="rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {sessionTypeLabel(item.sessionType)}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{item.titleIt}</h2>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {formatDateTime(item.startedAt)} / {item.status === "completed" ? "完了" : "途中"} /{" "}
                  {formatPercent(item.score)}
                </p>
              </div>
              <Link
                className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium"
                href={`/${routeSegmentFromSessionType(item.sessionType)}/${item.sessionNumber}/review?attemptId=${item.attemptId}`}
              >
                復習する
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
