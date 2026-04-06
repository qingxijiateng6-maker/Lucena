"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type {
  GetProgressResponse,
  GetReadingLearningResponse,
  SubmitSessionResponse,
} from "@/types/api";
import { LoginPromptModal } from "@/components/auth/login-prompt-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

export function ReadingStudyClient({
  sessionNumber,
}: {
  sessionNumber: number;
}) {
  const [data, setData] = useState<GetReadingLearningResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [questionPanelOpen, setQuestionPanelOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [result, setResult] = useState<SubmitSessionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const progressLoadedRef = useRef(false);
  const { status } = useAuth();

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(`/api/reading/${sessionNumber}/learning`, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("教材を取得できませんでした。");
        }

        setData((await response.json()) as GetReadingLearningResponse);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "教材を取得できませんでした。",
        );
      }
    };

    void load();
    return () => controller.abort();
  }, [sessionNumber]);

  useEffect(() => {
    if (status === "guest") {
      setPromptOpen(true);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !data || progressLoadedRef.current) {
      return;
    }

    const controller = new AbortController();
    const loadProgress = async () => {
      try {
        const response = await fetch(`/api/progress/${data.sessionId}`, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }

        const progress = (await response.json()) as GetProgressResponse;
        setSelectedAnswers(progress.selectedAnswers);
        setCurrentQuestionIndex(progress.currentQuestionIndex);
        setQuestionPanelOpen(Boolean(progress.uiState.readingQuestionPanelOpen));
        progressLoadedRef.current = true;
      } catch {
        progressLoadedRef.current = true;
      }
    };

    void loadProgress();
    return () => controller.abort();
  }, [data, status]);

  useEffect(() => {
    if (status !== "authenticated" || !data || result) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetch(`/api/progress/${data.sessionId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentQuestionIndex,
          selectedAnswers,
          uiState: {
            readingQuestionPanelOpen: questionPanelOpen,
          },
          draftMemoState: [],
        }),
      });
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [currentQuestionIndex, data, questionPanelOpen, result, selectedAnswers, status]);

  const currentQuestion = data?.questions[currentQuestionIndex];
  const allAnswered = useMemo(
    () =>
      data ? data.questions.every((question) => Boolean(selectedAnswers[question.questionId])) : false,
    [data, selectedAnswers],
  );

  const submitAnswers = async () => {
    if (!data) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/reading/${sessionNumber}/submit`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: selectedAnswers }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(payload?.error?.message || "採点に失敗しました。");
      }

      setResult((await response.json()) as SubmitSessionResponse);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "採点に失敗しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="space-y-6 pb-32">
        {!data && !error ? <LoadingState label="Reading セッションを読み込んでいます..." /> : null}
        {error ? <ErrorState message={error} /> : null}

        {data ? (
          <>
            <header className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Reading Session {sessionNumber.toString().padStart(2, "0")}
              </p>
              <h1 className="text-3xl font-semibold">{data.titleIt}</h1>
            </header>

            <article className="rounded-[32px] border border-[var(--line)] bg-white px-6 py-8 shadow-sm md:px-10">
              {data.body.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.paragraphIndex}
                  className="mb-6 text-base leading-9 text-[var(--foreground)]"
                >
                  {paragraph.sentences.map((sentence) => sentence.text).join(" ")}
                </p>
              ))}
            </article>

            {result ? (
              <section className="rounded-[28px] border border-[var(--line)] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">採点結果</h2>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {result.correctCount} / {result.questionCount} 問正解 ・ {result.score}%
                </p>
                <div className="mt-4 space-y-3">
                  {result.rationales.map((item) => (
                    <div
                      key={item.questionId}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-sm leading-7"
                    >
                      <strong>{item.questionId}</strong>
                      <p className="mt-2 text-[var(--muted)]">{item.shortRationaleJa}</p>
                    </div>
                  ))}
                </div>
                <Link
                  className="mt-5 inline-flex rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white"
                  href={result.reviewUrl}
                >
                  復習へ進む
                </Link>
              </section>
            ) : null}
          </>
        ) : null}
      </section>

      {data && !result ? (
        <>
          <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
            <button
              className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-medium shadow-lg"
              onClick={() => setQuestionPanelOpen((current) => !current)}
              type="button"
            >
              {questionPanelOpen ? "問題を閉じる" : "問題を表示"}
            </button>
          </div>

          {questionPanelOpen && currentQuestion ? (
            <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-white px-4 pb-6 pt-4 shadow-2xl">
              <div className="mx-auto max-w-4xl">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-[var(--muted)]">
                    {currentQuestionIndex + 1} / {data.questions.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-[var(--line)] px-3 py-2 text-sm"
                      disabled={currentQuestionIndex === 0}
                      onClick={() =>
                        setCurrentQuestionIndex((current) => Math.max(0, current - 1))
                      }
                      type="button"
                    >
                      ←
                    </button>
                    <button
                      className="rounded-full border border-[var(--line)] px-3 py-2 text-sm"
                      disabled={currentQuestionIndex === data.questions.length - 1}
                      onClick={() =>
                        setCurrentQuestionIndex((current) =>
                          Math.min(data.questions.length - 1, current + 1),
                        )
                      }
                      type="button"
                    >
                      →
                    </button>
                  </div>
                </div>

                <h2 className="mt-4 text-lg font-semibold">{currentQuestion.prompt}</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {currentQuestion.choices.map((choice) => {
                    const selected = selectedAnswers[currentQuestion.questionId] === choice.choiceId;
                    return (
                      <button
                        key={choice.choiceId}
                        className={`rounded-2xl border px-4 py-4 text-left text-sm leading-7 ${
                          selected
                            ? "border-[var(--foreground)] bg-[var(--accent)]"
                            : "border-[var(--line)] bg-[var(--panel-soft)]"
                        }`}
                        onClick={() =>
                          setSelectedAnswers((current) => ({
                            ...current,
                            [currentQuestion.questionId]: choice.choiceId,
                          }))
                        }
                        type="button"
                      >
                        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                          {choice.choiceId}
                        </span>
                        <span className="mt-2 block">{choice.text}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-[var(--muted)]">
                    {allAnswered
                      ? "全問回答済みです。"
                      : "全問回答すると一括採点できます。"}
                  </p>
                  <button
                    className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!allAnswered || isSubmitting}
                    onClick={() => void submitAnswers()}
                    type="button"
                  >
                    {isSubmitting ? "採点中..." : "一括採点する"}
                  </button>
                </div>
              </div>
            </aside>
          ) : null}
        </>
      ) : null}

      <LoginPromptModal
        onClose={() => setPromptOpen(false)}
        open={promptOpen}
      />
    </>
  );
}
