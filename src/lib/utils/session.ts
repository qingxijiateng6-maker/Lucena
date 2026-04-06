import type { SessionType } from "@/types/session";

export function routeSegmentFromSessionType(sessionType: SessionType) {
  return sessionType === "reading" ? "leggere" : "ascoltare";
}

export function sessionTypeLabel(sessionType: SessionType) {
  return sessionType === "reading" ? "Leggere" : "Ascoltare";
}

export function sessionTypeFromSessionId(sessionId: string): SessionType {
  if (sessionId.startsWith("reading-")) {
    return "reading";
  }

  return "listening";
}
