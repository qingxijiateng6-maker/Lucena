import type { TimestampLike } from "@/types/session";

export function toIsoString(value: TimestampLike | null | undefined) {
  if (!value) {
    return new Date(0).toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value.toDate().toISOString();
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatPercent(score: number | null) {
  return score === null ? "-" : `${score}%`;
}
