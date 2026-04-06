import { promises as fs } from "node:fs";
import path from "node:path";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  getFixtureCatalogByNumber,
  getFixtureLearning,
  getFixtureReview,
  listFixtureCatalog,
} from "@/lib/sessions/fixtures";
import type {
  AttemptDoc,
  NoteDoc,
  SavedProgressDoc,
  SessionCatalogDoc,
  SessionType,
  UserDoc,
} from "@/types/session";
import type { NoteDraft } from "@/types/note";
import { sessionTypeFromSessionId } from "@/lib/utils/session";

interface LocalDb {
  users: Record<string, UserDoc>;
  attempts: Record<string, AttemptDoc>;
  notes: Record<string, NoteDoc>;
  progress: Record<string, SavedProgressDoc>;
}

export interface CreateAttemptInput {
  uid: string;
  sessionId: string;
  sessionType: SessionType;
  sessionNumber: number;
  questionCount: number;
  correctCount: number;
  score: number;
  answers: AttemptDoc["answers"];
}

export interface AppRepository {
  listCatalog(type: SessionType): Promise<SessionCatalogDoc[]>;
  getCatalogByNumber(
    type: SessionType,
    sessionNumber: number,
  ): Promise<SessionCatalogDoc | null>;
  getLearningBySessionId(sessionId: string): Promise<unknown | null>;
  getReviewBySessionId(sessionId: string): Promise<unknown | null>;
  upsertUser(user: UserDoc): Promise<void>;
  listLearnedSessionIds(uid: string, type: SessionType): Promise<string[]>;
  createCompletedAttempt(input: CreateAttemptInput): Promise<AttemptDoc>;
  getAttemptById(attemptId: string): Promise<AttemptDoc | null>;
  listAttempts(uid: string): Promise<AttemptDoc[]>;
  listNotes(
    uid: string,
    filters?: { sessionId?: string; tag?: string },
  ): Promise<NoteDoc[]>;
  createNote(uid: string, input: NoteDraft & { sessionId: string }): Promise<NoteDoc>;
  updateNote(uid: string, noteId: string, input: Partial<NoteDraft>): Promise<NoteDoc | null>;
  deleteNote(uid: string, noteId: string): Promise<boolean>;
  getProgress(uid: string, sessionId: string): Promise<SavedProgressDoc | null>;
  putProgress(progress: SavedProgressDoc): Promise<void>;
  clearProgress(uid: string, sessionId: string): Promise<void>;
}

function isFallbackEnabled() {
  return process.env.NODE_ENV !== "production";
}

function shouldFallbackToLocal(error: unknown) {
  if (!isFallbackEnabled()) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Cloud Firestore API has not been used") ||
    message.includes("PERMISSION_DENIED") ||
    message.includes("The default Firebase app does not exist") ||
    message.includes("Could not load the default credentials")
  );
}

const LOCAL_DB_PATH = path.join(process.cwd(), ".local-app-db.json");

function createEmptyDb(): LocalDb {
  return {
    users: {},
    attempts: {},
    notes: {},
    progress: {},
  };
}

async function readLocalDb() {
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, "utf8");
    return JSON.parse(raw) as LocalDb;
  } catch {
    return createEmptyDb();
  }
}

async function writeLocalDb(db: LocalDb) {
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function progressKey(uid: string, sessionId: string) {
  return `${uid}__${sessionId}`;
}

class LocalRepository implements AppRepository {
  async listCatalog(type: SessionType) {
    return listFixtureCatalog(type);
  }

  async getCatalogByNumber(type: SessionType, sessionNumber: number) {
    return getFixtureCatalogByNumber(type, sessionNumber);
  }

  async getLearningBySessionId(sessionId: string) {
    return getFixtureLearning(sessionId);
  }

  async getReviewBySessionId(sessionId: string) {
    return getFixtureReview(sessionId);
  }

  async upsertUser(user: UserDoc) {
    const db = await readLocalDb();
    db.users[user.uid] = user;
    await writeLocalDb(db);
  }

  async listLearnedSessionIds(uid: string, type: SessionType) {
    const db = await readLocalDb();
    return Object.values(db.attempts)
      .filter(
        (item) =>
          item.uid === uid &&
          item.sessionType === type &&
          item.status === "completed",
      )
      .map((item) => item.sessionId);
  }

  async createCompletedAttempt(input: CreateAttemptInput) {
    const db = await readLocalDb();
    const now = new Date().toISOString();
    const attempt: AttemptDoc = {
      attemptId: crypto.randomUUID(),
      uid: input.uid,
      sessionId: input.sessionId,
      sessionType: input.sessionType,
      sessionNumber: input.sessionNumber,
      startedAt: now,
      completedAt: now,
      status: "completed",
      score: input.score,
      correctCount: input.correctCount,
      questionCount: input.questionCount,
      answers: input.answers,
    };
    db.attempts[attempt.attemptId] = attempt;
    await writeLocalDb(db);
    return attempt;
  }

  async getAttemptById(attemptId: string) {
    const db = await readLocalDb();
    return db.attempts[attemptId] || null;
  }

  async listAttempts(uid: string) {
    const db = await readLocalDb();
    return Object.values(db.attempts)
      .filter((item) => item.uid === uid)
      .sort(
        (a, b) =>
          new Date(String(b.startedAt)).getTime() -
          new Date(String(a.startedAt)).getTime(),
      );
  }

  async listNotes(uid: string, filters?: { sessionId?: string; tag?: string }) {
    const db = await readLocalDb();
    return Object.values(db.notes)
      .filter((item) => item.uid === uid)
      .filter((item) => (filters?.sessionId ? item.sessionId === filters.sessionId : true))
      .filter((item) => (filters?.tag ? item.tags.includes(filters.tag) : true))
      .sort(
        (a, b) =>
          new Date(String(b.updatedAt)).getTime() -
          new Date(String(a.updatedAt)).getTime(),
      );
  }

  async createNote(uid: string, input: NoteDraft & { sessionId: string }) {
    const db = await readLocalDb();
    const now = new Date().toISOString();
    const noteId = crypto.randomUUID();
    const note: NoteDoc = {
      noteId,
      uid,
      sessionId: input.sessionId,
      sessionType: sessionTypeFromSessionId(input.sessionId),
      title: input.title,
      body: input.body,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    };
    db.notes[noteId] = note;
    await writeLocalDb(db);
    return note;
  }

  async updateNote(uid: string, noteId: string, input: Partial<NoteDraft>) {
    const db = await readLocalDb();
    const existing = db.notes[noteId];
    if (!existing || existing.uid !== uid) {
      return null;
    }

    const updated: NoteDoc = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    db.notes[noteId] = updated;
    await writeLocalDb(db);
    return updated;
  }

  async deleteNote(uid: string, noteId: string) {
    const db = await readLocalDb();
    const existing = db.notes[noteId];
    if (!existing || existing.uid !== uid) {
      return false;
    }

    delete db.notes[noteId];
    await writeLocalDb(db);
    return true;
  }

  async getProgress(uid: string, sessionId: string) {
    const db = await readLocalDb();
    return db.progress[progressKey(uid, sessionId)] || null;
  }

  async putProgress(progress: SavedProgressDoc) {
    const db = await readLocalDb();
    db.progress[progressKey(progress.uid, progress.sessionId)] = progress;
    await writeLocalDb(db);
  }

  async clearProgress(uid: string, sessionId: string) {
    const db = await readLocalDb();
    delete db.progress[progressKey(uid, sessionId)];
    await writeLocalDb(db);
  }
}

class FirestoreRepository implements AppRepository {
  private db = getAdminDb();

  async listCatalog(type: SessionType) {
    const snapshot = await this.db.collection("sessions_catalog").get();
    return snapshot.docs
      .map((doc) => doc.data() as SessionCatalogDoc)
      .filter((item) => item.sessionType === type && item.isPublished)
      .sort((a, b) => a.sessionNumber - b.sessionNumber);
  }

  async getCatalogByNumber(type: SessionType, sessionNumber: number) {
    const items = await this.listCatalog(type);
    return items.find((item) => item.sessionNumber === sessionNumber) || null;
  }

  async getLearningBySessionId(sessionId: string) {
    const snapshot = await this.db.collection("sessions_learning").doc(sessionId).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  async getReviewBySessionId(sessionId: string) {
    const snapshot = await this.db.collection("sessions_review").doc(sessionId).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  async upsertUser(user: UserDoc) {
    await this.db.collection("users").doc(user.uid).set(
      {
        ...user,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: user.createdAt || FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  async listLearnedSessionIds(uid: string, type: SessionType) {
    const snapshot = await this.db
      .collection("user_session_attempts")
      .where("uid", "==", uid)
      .get();

    return snapshot.docs
      .map((doc) => doc.data() as AttemptDoc)
      .filter((item) => item.sessionType === type && item.status === "completed")
      .map((item) => item.sessionId);
  }

  async createCompletedAttempt(input: CreateAttemptInput) {
    const attemptId = crypto.randomUUID();
    const doc: AttemptDoc = {
      attemptId,
      uid: input.uid,
      sessionId: input.sessionId,
      sessionType: input.sessionType,
      sessionNumber: input.sessionNumber,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: "completed",
      score: input.score,
      correctCount: input.correctCount,
      questionCount: input.questionCount,
      answers: input.answers,
    };

    await this.db.collection("user_session_attempts").doc(attemptId).set({
      ...doc,
      startedAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
    });

    return doc;
  }

  async getAttemptById(attemptId: string) {
    const snapshot = await this.db.collection("user_session_attempts").doc(attemptId).get();
    return snapshot.exists ? (snapshot.data() as AttemptDoc) : null;
  }

  async listAttempts(uid: string) {
    const snapshot = await this.db
      .collection("user_session_attempts")
      .where("uid", "==", uid)
      .get();

    return snapshot.docs
      .map((doc) => doc.data() as AttemptDoc)
      .sort(
        (a, b) =>
          new Date(String(b.startedAt)).getTime() -
          new Date(String(a.startedAt)).getTime(),
      );
  }

  async listNotes(uid: string, filters?: { sessionId?: string; tag?: string }) {
    const snapshot = await this.db.collection("notes").where("uid", "==", uid).get();
    return snapshot.docs
      .map((doc) => doc.data() as NoteDoc)
      .filter((item) => (filters?.sessionId ? item.sessionId === filters.sessionId : true))
      .filter((item) => (filters?.tag ? item.tags.includes(filters.tag) : true))
      .sort(
        (a, b) =>
          new Date(String(b.updatedAt)).getTime() -
          new Date(String(a.updatedAt)).getTime(),
      );
  }

  async createNote(uid: string, input: NoteDraft & { sessionId: string }) {
    const noteId = crypto.randomUUID();
    const now = new Date().toISOString();
    const note: NoteDoc = {
      noteId,
      uid,
      sessionId: input.sessionId,
      sessionType: sessionTypeFromSessionId(input.sessionId),
      title: input.title,
      body: input.body,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.collection("notes").doc(noteId).set({
      ...note,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return note;
  }

  async updateNote(uid: string, noteId: string, input: Partial<NoteDraft>) {
    const ref = this.db.collection("notes").doc(noteId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return null;
    }

    const existing = snapshot.data() as NoteDoc;
    if (existing.uid !== uid) {
      return null;
    }

    const updated: NoteDoc = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await ref.set(
      {
        ...input,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return updated;
  }

  async deleteNote(uid: string, noteId: string) {
    const ref = this.db.collection("notes").doc(noteId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return false;
    }

    const existing = snapshot.data() as NoteDoc;
    if (existing.uid !== uid) {
      return false;
    }

    await ref.delete();
    return true;
  }

  async getProgress(uid: string, sessionId: string) {
    const snapshot = await this.db
      .collection("saved_progress")
      .doc(progressKey(uid, sessionId))
      .get();

    return snapshot.exists ? (snapshot.data() as SavedProgressDoc) : null;
  }

  async putProgress(progress: SavedProgressDoc) {
    await this.db
      .collection("saved_progress")
      .doc(progressKey(progress.uid, progress.sessionId))
      .set({
        ...progress,
        updatedAt: FieldValue.serverTimestamp(),
      });
  }

  async clearProgress(uid: string, sessionId: string) {
    await this.db
      .collection("saved_progress")
      .doc(progressKey(uid, sessionId))
      .delete();
  }
}

class ResilientRepository implements AppRepository {
  private readonly local = new LocalRepository();

  private readonly remote: FirestoreRepository | null;

  constructor() {
    this.remote = isFirebaseAdminConfigured() ? new FirestoreRepository() : null;
  }

  private async withFallback<T>(
    remoteAction: () => Promise<T>,
    localAction: () => Promise<T>,
  ) {
    if (!this.remote) {
      return localAction();
    }

    try {
      return await remoteAction();
    } catch (error) {
      if (shouldFallbackToLocal(error)) {
        return localAction();
      }
      throw error;
    }
  }

  async listCatalog(type: SessionType) {
    return this.withFallback(
      () => this.remote!.listCatalog(type),
      () => this.local.listCatalog(type),
    );
  }

  async getCatalogByNumber(type: SessionType, sessionNumber: number) {
    return this.withFallback(
      () => this.remote!.getCatalogByNumber(type, sessionNumber),
      () => this.local.getCatalogByNumber(type, sessionNumber),
    );
  }

  async getLearningBySessionId(sessionId: string) {
    return this.withFallback(
      () => this.remote!.getLearningBySessionId(sessionId),
      () => this.local.getLearningBySessionId(sessionId),
    );
  }

  async getReviewBySessionId(sessionId: string) {
    return this.withFallback(
      () => this.remote!.getReviewBySessionId(sessionId),
      () => this.local.getReviewBySessionId(sessionId),
    );
  }

  async upsertUser(user: UserDoc) {
    return this.withFallback(
      () => this.remote!.upsertUser(user),
      () => this.local.upsertUser(user),
    );
  }

  async listLearnedSessionIds(uid: string, type: SessionType) {
    return this.withFallback(
      () => this.remote!.listLearnedSessionIds(uid, type),
      () => this.local.listLearnedSessionIds(uid, type),
    );
  }

  async createCompletedAttempt(input: CreateAttemptInput) {
    return this.withFallback(
      () => this.remote!.createCompletedAttempt(input),
      () => this.local.createCompletedAttempt(input),
    );
  }

  async getAttemptById(attemptId: string) {
    return this.withFallback(
      () => this.remote!.getAttemptById(attemptId),
      () => this.local.getAttemptById(attemptId),
    );
  }

  async listAttempts(uid: string) {
    return this.withFallback(
      () => this.remote!.listAttempts(uid),
      () => this.local.listAttempts(uid),
    );
  }

  async listNotes(uid: string, filters?: { sessionId?: string; tag?: string }) {
    return this.withFallback(
      () => this.remote!.listNotes(uid, filters),
      () => this.local.listNotes(uid, filters),
    );
  }

  async createNote(uid: string, input: NoteDraft & { sessionId: string }) {
    return this.withFallback(
      () => this.remote!.createNote(uid, input),
      () => this.local.createNote(uid, input),
    );
  }

  async updateNote(uid: string, noteId: string, input: Partial<NoteDraft>) {
    return this.withFallback(
      () => this.remote!.updateNote(uid, noteId, input),
      () => this.local.updateNote(uid, noteId, input),
    );
  }

  async deleteNote(uid: string, noteId: string) {
    return this.withFallback(
      () => this.remote!.deleteNote(uid, noteId),
      () => this.local.deleteNote(uid, noteId),
    );
  }

  async getProgress(uid: string, sessionId: string) {
    return this.withFallback(
      () => this.remote!.getProgress(uid, sessionId),
      () => this.local.getProgress(uid, sessionId),
    );
  }

  async putProgress(progress: SavedProgressDoc) {
    return this.withFallback(
      () => this.remote!.putProgress(progress),
      () => this.local.putProgress(progress),
    );
  }

  async clearProgress(uid: string, sessionId: string) {
    return this.withFallback(
      () => this.remote!.clearProgress(uid, sessionId),
      () => this.local.clearProgress(uid, sessionId),
    );
  }
}

let repository: AppRepository | null = null;

export function getRepository(): AppRepository {
  if (repository) {
    return repository;
  }

  repository = new ResilientRepository();

  return repository;
}
