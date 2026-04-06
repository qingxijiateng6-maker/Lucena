"use client";

import { useEffect, useMemo, useState } from "react";
import type { GetReadingReviewResponse } from "@/types/api";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

export function ReadingReviewClient({
  sessionNumber,
}: {
  sessionNumber: number;
}) {
  const [data, setData] = useState<GetReadingReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSentenceId, setSelectedSentenceId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const query = window.location.search;

    const load = async () => {
      try {
        const response = await fetch(`/api/reading/${sessionNumber}/review${query}`, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("復習データを取得できませんでした。");
        }
        const payload = (await response.json()) as GetReadingReviewResponse;
        setData(payload);
        setSelectedSentenceId(
          payload.reviewBody.paragraphs[0]?.sentences[0]?.sentenceId || null,
        );
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "復習データを取得できませんでした。",
        );
      }
    };

    void load();
    return () => controller.abort();
  }, [sessionNumber]);

  const sentenceLookup = useMemo(() => {
    const entries =
      data?.reviewBody.paragraphs.flatMap((paragraph) => paragraph.sentences) || [];
    return new Map(entries.map((sentence) => [sentence.sentenceId, sentence]));
  }, [data]);

  const selectedSentence = selectedSentenceId
    ? sentenceLookup.get(selectedSentenceId) || null
    : null;

  const speakSentence = () => {
    if (!selectedSentence || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedSentence.ttsText);
    utterance.lang = "it-IT";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section className="space-y-6">
      {!data && !error ? <LoadingState label="復習データを読み込んでいます..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      {data ? (
        <>
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Reading Review
              </p>
              <h1 className="mt-3 text-3xl font-semibold">{data.titleIt}</h1>
            </div>
            <div className="flex gap-2">
              <button
                className={`rounded-full px-4 py-2 text-sm ${
                  showExplanation
                    ? "bg-[var(--foreground)] text-white"
                    : "border border-[var(--line)] bg-white"
                }`}
                onClick={() => setShowExplanation(true)}
                type="button"
              >
                訳・解説表示
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm ${
                  !showExplanation
                    ? "bg-[var(--foreground)] text-white"
                    : "border border-[var(--line)] bg-white"
                }`}
                onClick={() => setShowExplanation(false)}
                type="button"
              >
                本文のみ
              </button>
            </div>
          </header>

          <details className="rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-sm">
            <summary className="cursor-pointer text-sm font-semibold">単語語彙</summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {data.wordGlossary.map((item) => (
                <article
                  key={item.lemma}
                  className="rounded-[20px] border border-[var(--line)] bg-[var(--panel-soft)] p-4"
                >
                  <h2 className="text-lg font-semibold">{item.lemma}</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {item.pos} / {item.morphology} / {item.meaningJa}
                  </p>
                  <div className="mt-3 space-y-2 text-sm leading-7">
                    {item.collocations.map((collocation) => (
                      <p key={collocation.it}>
                        <strong>{collocation.it}</strong> - {collocation.ja}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </details>

          <div
            className={`grid gap-6 ${
              showExplanation ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]" : ""
            }`}
          >
            <article className="rounded-[32px] border border-[var(--line)] bg-white px-6 py-8 shadow-sm md:px-10">
              {data.reviewBody.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.paragraphIndex}
                  className="mb-6 flex flex-wrap gap-x-2 gap-y-3 text-base leading-9"
                >
                  {paragraph.sentences.map((sentence) => (
                    <button
                      key={sentence.sentenceId}
                      className="rounded-md px-1 text-left"
                      onClick={() => {
                        setSelectedSentenceId(sentence.sentenceId);
                        setShowExplanation(true);
                      }}
                      style={{
                        backgroundColor:
                          selectedSentenceId === sentence.sentenceId
                            ? "var(--highlight)"
                            : "transparent",
                      }}
                      type="button"
                    >
                      {sentence.text}
                    </button>
                  ))}
                </p>
              ))}
            </article>

            {showExplanation && selectedSentence ? (
              <aside className="rounded-[32px] border border-[var(--line)] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold">選択文の解説</h2>
                  <button
                    className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
                    onClick={speakSentence}
                    type="button"
                  >
                    文を読み上げる
                  </button>
                </div>
                <div className="mt-5 space-y-5 text-sm leading-7">
                  <section>
                    <h3 className="font-semibold">自然訳</h3>
                    <p className="mt-2 text-[var(--muted)]">{selectedSentence.translation}</p>
                  </section>
                  <section>
                    <h3 className="font-semibold">構文分解</h3>
                    <p className="mt-2 text-[var(--muted)]">
                      {selectedSentence.analysis.structure}
                    </p>
                  </section>
                  <section>
                    <h3 className="font-semibold">文法解説</h3>
                    <div className="mt-2 space-y-3">
                      {selectedSentence.analysis.grammarPoints.map((point) => (
                        <div key={point.label}>
                          <p className="font-medium">{point.label}</p>
                          <p className="text-[var(--muted)]">{point.explanationJa}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="font-semibold">語彙補足</h3>
                    <div className="mt-2 space-y-3">
                      {selectedSentence.analysis.vocabNotes.map((note) => (
                        <div key={note.label}>
                          <p className="font-medium">{note.label}</p>
                          <p className="text-[var(--muted)]">{note.explanationJa}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </aside>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
