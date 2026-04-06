import type { SessionType } from "@/types/session";

export interface NoteDraft {
  title: string;
  body: string;
  tags: string[];
}

export interface NoteFilterState {
  sessionId: string;
  tag: string;
}

export interface EditableNote {
  noteId?: string;
  sessionId: string;
  sessionType: SessionType;
  title: string;
  body: string;
  tags: string[];
}
