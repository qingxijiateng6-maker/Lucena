"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type {
  GetListeningLearningResponse,
  GetProgressResponse,
  SubmitSessionResponse,
} from "@/types/api";
import { LoginPromptModal } from "@/components/auth/login-prompt-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

export function ListeningStudyClient({
  sessionNumber,
}: {
  sessionNumber: number;
}) {
  const [data, setData] = useState<GetListeningLearningResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [result, setResult] = useState<SubmitSessionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [hasFinishedPlayback, setHasFinishedPlayback] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressLoadedRef = useRef(false);
  const { status } = useAuth();

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(`/api/listening/${sessionNumber}/learning`, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("教材を取得できませんでした。");
        }

        setData((await response.json()) as GetListeningLearningResponse);
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
        setHasStartedPlayback(Boolean(progress.uiState.listeningPlaybackStarted));
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
            listeningPlaybackStarted: hasStartedPlayback,
          },
          draftMemoState: [],
        }),
      });
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [currentQuestionIndex, data, hasStartedPlayback, result, selectedAnswers, status]);

  const currentQuestion = data?.questions[currentQuestionIndex];
  const allAnswered = useMemo(
    () =>
      data ? data.questions.every((question) => Boolean(selectedAnswers[question.questionId])) : false,
    [data, selectedAnswers],
  );

  const startPlayback = async () => {
    if (!audioRef.current || hasStartedPlayback) {
      return;
    }

    try {
      await audioRef.current.play();
      setHasStartedPlayback(true);
    } catch {
      setError("音声の再生を開始できませんでした。");
    }
  };

  const submitAnswers = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/listening/${sessionNumber}/submit`, {
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

  const progressPercent = data
    ? Math.min((playbackTime / data.audio.durationSec) * 100, 100)
    : 0;

  return (
    <>
      <section className="space-y-6 pb-20">
        {!data && !error ? <LoadingState label="Listening セッションを読み込んでいます..." /> : null}
        {error ? <ErrorState message={error} /> : null}

        {data ? (
          <>
            <header className="space-y-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Listening Session {sessionNumber.toString().padStart(2, "0")}
              </p>
              <h1 className="text-3xl font-semibold">{data.titleIt}</h1>
            </header>

            <section className="rounded-[32px] border border-[var(--line)] bg-white p-8 shadow-sm">
              <audio
                onEnded={() => setHasFinishedPlayback(true)}
                onTimeUpdate={(event) => setPlaybackTime(event.currentTarget.currentTime)}
                preload="metadata"
                ref={audioRef}
                src={data.audio.audioUrl}
              />
              <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm text-[var(--muted)]">
                  再生開始前は回答できません。再生は1回のみで、一時停止や巻き戻しはできません。
                </p>
                <div className="mt-6 h-2 rounded-full bg-[var(--panel-soft)]">
                  <div
                    className="h-2 rounded-full bg-[var(--foreground)] transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={hasStartedPlayback}
                    onClick={() => void startPlayback()}
                    type="button"
                  >
                    {hasStartedPlayback ? "再生済み" : "再生開始"}
                  </button>
                  <p className="text-sm text-[var(--muted)]">
                    {hasFinishedPlayback ? "再生終了" : `${Math.floor(playbackTime)} / ${data.audio.durationSec} sec`}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] border border-[var(--line)] bg-white p-6 shadow-sm">
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

              {currentQuestion ? (
                <>
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
                          } ${!hasStartedPlayback ? "opacity-60" : ""}`}
                          disabled={!hasStartedPlayback}
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
                </>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--muted)]">
                  {!hasStartedPlayback
                    ? "まず音声を再生してください。"
                    : allAnswered
                      ? "全問回答済みです。"
                      : "左右矢印で問題を移動できます。"}
                </p>
                <button
                  className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!hasStartedPlayback || !allAnswered || isSubmitting}
                  onClick={() => void submitAnswers()}
                  type="button"
                >
                  {isSubmitting ? "採点中..." : "一括採点する"}
                </button>
              </div>
            </section>

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

      <LoginPromptModal onClose={() => setPromptOpen(false)} open={promptOpen} />
    </>
  );
}
