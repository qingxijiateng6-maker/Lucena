"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GetListeningLearningResponse,
  GetListeningReviewResponse,
} from "@/types/api";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";

const speedOptions = [0.5, 0.75, 1];

export function ListeningReviewClient({
  sessionNumber,
}: {
  sessionNumber: number;
}) {
  const [reviewData, setReviewData] = useState<GetListeningReviewResponse | null>(null);
  const [learningData, setLearningData] = useState<GetListeningLearningResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segmentRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const controller = new AbortController();
    const query = window.location.search;

    const load = async () => {
      try {
        const [reviewResponse, learningResponse] = await Promise.all([
          fetch(`/api/listening/${sessionNumber}/review${query}`, {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          }),
          fetch(`/api/listening/${sessionNumber}/learning`, {
            cache: "no-store",
            credentials: "include",
            signal: controller.signal,
          }),
        ]);

        if (!reviewResponse.ok || !learningResponse.ok) {
          throw new Error("復習データを取得できませんでした。");
        }

        const reviewPayload = (await reviewResponse.json()) as GetListeningReviewResponse;
        const learningPayload = (await learningResponse.json()) as GetListeningLearningResponse;
        setReviewData(reviewPayload);
        setLearningData(learningPayload);
        const firstId = reviewPayload.transcript.segments[0]?.segmentId || null;
        setSelectedSegmentId(firstId);
        setActiveSegmentId(firstId);
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

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const selectedSegment = useMemo(
    () =>
      reviewData?.transcript.segments.find((segment) => segment.segmentId === selectedSegmentId) ||
      null,
    [reviewData, selectedSegmentId],
  );

  const handleTimeUpdate = () => {
    if (!audioRef.current || !reviewData) {
      return;
    }

    const currentTime = audioRef.current.currentTime;
    const nextActive =
      reviewData.transcript.segments.find(
        (segment) =>
          currentTime >= segment.startSec && currentTime < segment.endSec,
      ) || null;

    if (!nextActive || nextActive.segmentId === activeSegmentId) {
      return;
    }

    setActiveSegmentId(nextActive.segmentId);
    const target = segmentRefs.current[nextActive.segmentId];
    if (target) {
      target.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  return (
    <section className="space-y-6">
      {!reviewData && !error ? <LoadingState label="復習データを読み込んでいます..." /> : null}
      {error ? <ErrorState message={error} /> : null}

      {reviewData && learningData ? (
        <>
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              Listening Review
            </p>
            <h1 className="text-3xl font-semibold">{reviewData.titleIt}</h1>
          </header>

          <div className="sticky top-20 z-20 rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-sm">
            <audio
              controls
              onTimeUpdate={handleTimeUpdate}
              ref={audioRef}
              src={learningData.audio.audioUrl}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {speedOptions.map((speed) => (
                <button
                  key={speed}
                  className={`rounded-full px-4 py-2 text-sm ${
                    playbackRate === speed
                      ? "bg-[var(--foreground)] text-white"
                      : "border border-[var(--line)] bg-[var(--panel-soft)]"
                  }`}
                  onClick={() => setPlaybackRate(speed)}
                  type="button"
                >
                  {speed.toFixed(2).replace(/0$/, "")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <article className="rounded-[32px] border border-[var(--line)] bg-white p-6 shadow-sm">
              <div className="space-y-3">
                {reviewData.transcript.segments.map((segment) => {
                  const isActive = segment.segmentId === activeSegmentId;
                  const isSelected = segment.segmentId === selectedSegmentId;
                  return (
                    <button
                      key={segment.segmentId}
                      className={`block w-full rounded-2xl px-4 py-3 text-left transition ${
                        isActive || isSelected
                          ? "bg-[var(--accent)]"
                          : "bg-[var(--panel-soft)]"
                      }`}
                      onClick={() => {
                        setSelectedSegmentId(segment.segmentId);
                        if (audioRef.current) {
                          audioRef.current.currentTime = segment.startSec;
                        }
                      }}
                      ref={(node) => {
                        segmentRefs.current[segment.segmentId] = node;
                      }}
                      type="button"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                        {segment.speakerName}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[var(--foreground)]">
                        {segment.text}
                      </p>
                    </button>
                  );
                })}
              </div>
            </article>

            {selectedSegment ? (
              <aside className="rounded-[32px] border border-[var(--line)] bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold">選択文の解説</h2>
                <div className="mt-5 space-y-5 text-sm leading-7">
                  <section>
                    <h3 className="font-semibold">自然訳</h3>
                    <p className="mt-2 text-[var(--muted)]">{selectedSegment.translation}</p>
                  </section>
                  <section>
                    <h3 className="font-semibold">構文分解</h3>
                    <p className="mt-2 text-[var(--muted)]">
                      {selectedSegment.analysis.structure}
                    </p>
                  </section>
                  <section>
                    <h3 className="font-semibold">文法解説</h3>
                    <div className="mt-2 space-y-3">
                      {selectedSegment.analysis.grammarPoints.map((point) => (
                        <div key={point.label}>
                          <p className="font-medium">{point.label}</p>
                          <p className="text-[var(--muted)]">{point.explanationJa}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="font-semibold">必要語彙</h3>
                    <div className="mt-2 space-y-3">
                      {selectedSegment.analysis.vocabNotes.map((note) => (
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
