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

function progressKey(uid: string, sessionId: string) {
  return `${uid}__${sessionId}`;
}

function firestoreRequiredForUserData(): never {
  throw new Error("Firestore is required for user data operations.");
}

class FixtureRepository implements AppRepository {
  async listCatalog(type: SessionType): Promise<SessionCatalogDoc[]> {
    return listFixtureCatalog(type);
  }

  async getCatalogByNumber(
    type: SessionType,
    sessionNumber: number,
  ): Promise<SessionCatalogDoc | null> {
    return getFixtureCatalogByNumber(type, sessionNumber);
  }

  async getLearningBySessionId(sessionId: string): Promise<unknown | null> {
    return getFixtureLearning(sessionId);
  }

  async getReviewBySessionId(sessionId: string): Promise<unknown | null> {
    return getFixtureReview(sessionId);
  }

  async upsertUser(_user: UserDoc): Promise<void> {
    void _user;
    return firestoreRequiredForUserData();
  }

  async listLearnedSessionIds(_uid: string, _type: SessionType): Promise<string[]> {
    void _uid;
    void _type;
    return firestoreRequiredForUserData();
  }

  async createCompletedAttempt(_input: CreateAttemptInput): Promise<AttemptDoc> {
    void _input;
    return firestoreRequiredForUserData();
  }

  async getAttemptById(_attemptId: string): Promise<AttemptDoc | null> {
    void _attemptId;
    return firestoreRequiredForUserData();
  }

  async listAttempts(_uid: string): Promise<AttemptDoc[]> {
    void _uid;
    return firestoreRequiredForUserData();
  }

  async listNotes(
    _uid: string,
    _filters?: { sessionId?: string; tag?: string },
  ): Promise<NoteDoc[]> {
    void _uid;
    void _filters;
    return firestoreRequiredForUserData();
  }

  async createNote(
    _uid: string,
    _input: NoteDraft & { sessionId: string },
  ): Promise<NoteDoc> {
    void _uid;
    void _input;
    return firestoreRequiredForUserData();
  }

  async updateNote(
    _uid: string,
    _noteId: string,
    _input: Partial<NoteDraft>,
  ): Promise<NoteDoc | null> {
    void _uid;
    void _noteId;
    void _input;
    return firestoreRequiredForUserData();
  }

  async deleteNote(_uid: string, _noteId: string): Promise<boolean> {
    void _uid;
    void _noteId;
    return firestoreRequiredForUserData();
  }

  async getProgress(_uid: string, _sessionId: string): Promise<SavedProgressDoc | null> {
    void _uid;
    void _sessionId;
    return firestoreRequiredForUserData();
  }

  async putProgress(_progress: SavedProgressDoc): Promise<void> {
    void _progress;
    return firestoreRequiredForUserData();
  }

  async clearProgress(_uid: string, _sessionId: string): Promise<void> {
    void _uid;
    void _sessionId;
    return firestoreRequiredForUserData();
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
  private readonly fixtures = new FixtureRepository();

  private readonly remote: FirestoreRepository | null;

  constructor() {
    this.remote = isFirebaseAdminConfigured() ? new FirestoreRepository() : null;
  }

  private async withContentFallback<T>(
    remoteAction: () => Promise<T>,
    fixtureAction: () => Promise<T>,
  ) {
    if (!this.remote) {
      return fixtureAction();
    }

    try {
      return await remoteAction();
    } catch (error) {
      if (shouldFallbackToLocal(error)) {
        return fixtureAction();
      }
      throw error;
    }
  }

  private requireRemote() {
    if (!this.remote) {
      throw new Error("Firestore is required for user data operations.");
    }

    return this.remote;
  }

  async listCatalog(type: SessionType) {
    return this.withContentFallback(
      () => this.remote!.listCatalog(type),
      () => this.fixtures.listCatalog(type),
    );
  }

  async getCatalogByNumber(type: SessionType, sessionNumber: number) {
    return this.withContentFallback(
      () => this.remote!.getCatalogByNumber(type, sessionNumber),
      () => this.fixtures.getCatalogByNumber(type, sessionNumber),
    );
  }

  async getLearningBySessionId(sessionId: string) {
    return this.withContentFallback(
      () => this.remote!.getLearningBySessionId(sessionId),
      () => this.fixtures.getLearningBySessionId(sessionId),
    );
  }

  async getReviewBySessionId(sessionId: string) {
    return this.withContentFallback(
      () => this.remote!.getReviewBySessionId(sessionId),
      () => this.fixtures.getReviewBySessionId(sessionId),
    );
  }

  async upsertUser(user: UserDoc) {
    return this.requireRemote().upsertUser(user);
  }

  async listLearnedSessionIds(uid: string, type: SessionType) {
    return this.requireRemote().listLearnedSessionIds(uid, type);
  }

  async createCompletedAttempt(input: CreateAttemptInput) {
    return this.requireRemote().createCompletedAttempt(input);
  }

  async getAttemptById(attemptId: string) {
    return this.requireRemote().getAttemptById(attemptId);
  }

  async listAttempts(uid: string) {
    return this.requireRemote().listAttempts(uid);
  }

  async listNotes(uid: string, filters?: { sessionId?: string; tag?: string }) {
    return this.requireRemote().listNotes(uid, filters);
  }

  async createNote(uid: string, input: NoteDraft & { sessionId: string }) {
    return this.requireRemote().createNote(uid, input);
  }

  async updateNote(uid: string, noteId: string, input: Partial<NoteDraft>) {
    return this.requireRemote().updateNote(uid, noteId, input);
  }

  async deleteNote(uid: string, noteId: string) {
    return this.requireRemote().deleteNote(uid, noteId);
  }

  async getProgress(uid: string, sessionId: string) {
    return this.requireRemote().getProgress(uid, sessionId);
  }

  async putProgress(progress: SavedProgressDoc) {
    return this.requireRemote().putProgress(progress);
  }

  async clearProgress(uid: string, sessionId: string) {
    return this.requireRemote().clearProgress(uid, sessionId);
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
