"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  GetNotesResponse,
  NoteItem,
  PatchNoteRequest,
  PostNoteRequest,
} from "@/types/api";
import { useAuth } from "@/components/auth/auth-provider";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

const initialForm = {
  sessionId: "reading-0001",
  sessionType: "reading" as const,
  title: "",
  body: "",
  tags: "単語",
};

type NoteFormState = {
  sessionId: string;
  sessionType: "reading" | "listening";
  title: string;
  body: string;
  tags: string;
};

export function NotesPageClient() {
  const { status } = useAuth();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionFilter, setSessionFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteFormState>(initialForm);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (sessionFilter) {
      params.set("sessionId", sessionFilter);
    }
    if (tagFilter) {
      params.set("tag", tagFilter);
    }
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [sessionFilter, tagFilter]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/notes${queryString}`, {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("メモの取得に失敗しました。");
        }

        const payload = (await response.json()) as GetNotesResponse;
        setNotes(payload.items);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "メモの取得に失敗しました。",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [queryString, status]);

  if (status !== "authenticated") {
    return (
      <section className="mx-auto max-w-2xl rounded-[28px] border border-[var(--line)] bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">メモ</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          メモはログインユーザー専用です。語彙、文法、表現のメモを session 単位で蓄積できます。
        </p>
      </section>
    );
  }

  const refreshNotes = async () => {
    const refreshed = await fetch(`/api/notes${queryString}`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!refreshed.ok) {
      throw new Error("メモ一覧の更新に失敗しました。");
    }

    const payloadResponse = (await refreshed.json()) as GetNotesResponse;
    setNotes(payloadResponse.items);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const submit = async () => {
    setError(null);

    const payload: PostNoteRequest = {
      sessionId: form.sessionId,
      sessionType: form.sessionType,
      title: form.title,
      body: form.body,
      tags: parseTags(form.tags),
    };

    const response = await fetch(editingId ? `/api/notes/${editingId}` : "/api/notes", {
      method: editingId ? "PATCH" : "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        editingId
          ? ({
              title: payload.title,
              body: payload.body,
              tags: payload.tags,
            } satisfies PatchNoteRequest)
          : payload,
      ),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      throw new Error(data?.error?.message || "メモの保存に失敗しました。");
    }

    resetForm();
    await refreshNotes();
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="space-y-4 rounded-[28px] border border-[var(--line)] bg-white p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Notes
          </p>
          <h1 className="mt-3 text-2xl font-semibold">メモ</h1>
        </div>
        <div className="space-y-3">
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm"
            onChange={(event) =>
              setForm((current) => ({ ...current, sessionId: event.target.value }))
            }
            placeholder="reading-0001"
            value={form.sessionId}
          />
          <select
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sessionType: event.target.value as "reading" | "listening",
              }))
            }
            value={form.sessionType}
          >
            <option value="reading">reading</option>
            <option value="listening">listening</option>
          </select>
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm"
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="タイトル"
            value={form.title}
          />
          <textarea
            className="min-h-40 w-full rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm leading-7"
            onChange={(event) =>
              setForm((current) => ({ ...current, body: event.target.value }))
            }
            placeholder="プレーンテキストでメモを書く"
            value={form.body}
          />
          <input
            className="w-full rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm"
            onChange={(event) =>
              setForm((current) => ({ ...current, tags: event.target.value }))
            }
            placeholder="単語, 文法, 表現"
            value={form.tags}
          />
          <div className="flex gap-3">
            <button
              className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-white"
              onClick={() =>
                void submit().catch((submitError) =>
                  setError(
                    submitError instanceof Error
                      ? submitError.message
                      : "メモの保存に失敗しました。",
                  ),
                )
              }
              type="button"
            >
              {editingId ? "更新する" : "作成する"}
            </button>
            <button
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium"
              onClick={resetForm}
              type="button"
            >
              クリア
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[28px] border border-[var(--line)] bg-white p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm"
              onChange={(event) => setSessionFilter(event.target.value)}
              placeholder="sessionId で絞り込み"
              value={sessionFilter}
            />
            <input
              className="rounded-2xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3 text-sm"
              onChange={(event) => setTagFilter(event.target.value)}
              placeholder="tag で絞り込み"
              value={tagFilter}
            />
          </div>
        </div>

        {loading ? <LoadingState label="メモを読み込んでいます..." /> : null}
        {error ? <ErrorState message={error} /> : null}

        {notes.map((note) => (
          <article
            key={note.noteId}
            className="rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  {note.sessionId}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{note.title}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
                  onClick={() => {
                    setEditingId(note.noteId);
                    setForm({
                      sessionId: note.sessionId,
                      sessionType: note.sessionType,
                      title: note.title,
                      body: note.body,
                      tags: note.tags.join(", "),
                    });
                  }}
                  type="button"
                >
                  編集
                </button>
                <button
                  className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700"
                  onClick={() =>
                    void fetch(`/api/notes/${note.noteId}`, {
                      method: "DELETE",
                      credentials: "include",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: "{}",
                    })
                      .then(async (response) => {
                        if (!response.ok) {
                          throw new Error("削除に失敗しました。");
                        }
                        await refreshNotes();
                      })
                      .catch((deleteError) =>
                        setError(
                          deleteError instanceof Error
                            ? deleteError.message
                            : "削除に失敗しました。",
                        ),
                      )
                  }
                  type="button"
                >
                  削除
                </button>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)]">
              {note.body}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span
                  key={`${note.noteId}-${tag}`}
                  className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs text-[var(--foreground)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
