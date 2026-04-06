import type {
  GetHistoryResponse,
  GetListeningLearningResponse,
  GetListeningReviewResponse,
  GetNotesResponse,
  GetProgressResponse,
  GetReadingLearningResponse,
  GetReadingReviewResponse,
  GetSessionsResponse,
  NoteItem,
  PutProgressRequest,
  SubmitSessionResponse,
} from "@/types/api";
import type { SessionUser } from "@/types/auth";
import type {
  ListeningLearningDoc,
  ListeningReviewDoc,
  NoteDoc,
  ReadingLearningDoc,
  ReadingReviewDoc,
  SessionCatalogDoc,
  SessionType,
} from "@/types/session";
import { signReviewToken, verifyReviewToken } from "@/lib/security/review-token";
import { getRepository } from "@/lib/data/store";
import { routeSegmentFromSessionType, sessionTypeFromSessionId } from "@/lib/utils/session";
import { toIsoString } from "@/lib/utils/format";
import type { PatchNoteRequest, PostNoteRequest } from "@/types/api";

function assertCatalog(
  catalog: SessionCatalogDoc | null,
): asserts catalog is SessionCatalogDoc {
  if (!catalog) {
    throw new Error("Session not found.");
  }
}

export async function listSessions(
  sessionType: SessionType,
  sessionUser: SessionUser | null,
): Promise<GetSessionsResponse> {
  const repository = getRepository();
  const items = await repository.listCatalog(sessionType);
  const learnedIds = sessionUser
    ? new Set(await repository.listLearnedSessionIds(sessionUser.uid, sessionType))
    : new Set<string>();

  return {
    items: items.map((item) => ({
      sessionId: item.sessionId,
      sessionNumber: item.sessionNumber,
      sessionType: item.sessionType,
      titleIt: item.titleIt,
      heroIllustrationPath: item.heroIllustrationPath,
      isLearned: learnedIds.has(item.sessionId),
    })),
  };
}

export async function getLearningPayload(
  sessionType: SessionType,
  sessionNumber: number,
): Promise<GetReadingLearningResponse | GetListeningLearningResponse> {
  const repository = getRepository();
  const catalog = await repository.getCatalogByNumber(sessionType, sessionNumber);
  assertCatalog(catalog);

  const learning = await repository.getLearningBySessionId(catalog.sessionId);
  if (!learning) {
    throw new Error("Learning content not found.");
  }

  if (sessionType === "reading") {
    const payload = learning as ReadingLearningDoc;
    return {
      sessionId: catalog.sessionId,
      sessionNumber: catalog.sessionNumber,
      titleIt: catalog.titleIt,
      body: payload.body,
      questions: payload.questions,
    };
  }

  const payload = learning as ListeningLearningDoc;
  return {
    sessionId: catalog.sessionId,
    sessionNumber: catalog.sessionNumber,
    titleIt: catalog.titleIt,
    audio: payload.audio,
    questions: payload.questions,
  };
}

function gradeAnswers(
  review: ReadingReviewDoc | ListeningReviewDoc,
  answers: Record<string, "A" | "B" | "C" | "D">,
) {
  const answerMap = new Map(
    review.answerKey.map((item) => [item.questionId, item.correctChoiceId]),
  );

  const rationales = review.answerKey.map((item) => ({
    questionId: item.questionId,
    shortRationaleJa: item.shortRationaleJa,
  }));

  const gradedAnswers = review.answerKey.map((item) => {
    const selectedChoiceId = answers[item.questionId] ?? null;
    return {
      questionId: item.questionId,
      selectedChoiceId,
      isCorrect: selectedChoiceId ? answerMap.get(item.questionId) === selectedChoiceId : false,
    };
  });

  const correctCount = gradedAnswers.filter((item) => item.isCorrect).length;
  const questionCount = review.answerKey.length;
  const score = Math.round((correctCount / questionCount) * 100);

  return {
    correctCount,
    questionCount,
    score,
    gradedAnswers,
    rationales,
  };
}

export async function submitSession(
  sessionType: SessionType,
  sessionNumber: number,
  answers: Record<string, "A" | "B" | "C" | "D">,
  sessionUser: SessionUser | null,
): Promise<SubmitSessionResponse> {
  const repository = getRepository();
  const catalog = await repository.getCatalogByNumber(sessionType, sessionNumber);
  assertCatalog(catalog);

  const review = await repository.getReviewBySessionId(catalog.sessionId);
  if (!review) {
    throw new Error("Review content not found.");
  }

  const graded = gradeAnswers(
    review as ReadingReviewDoc | ListeningReviewDoc,
    answers,
  );

  if (sessionUser) {
    const attempt = await repository.createCompletedAttempt({
      uid: sessionUser.uid,
      sessionId: catalog.sessionId,
      sessionType,
      sessionNumber: catalog.sessionNumber,
      questionCount: graded.questionCount,
      correctCount: graded.correctCount,
      score: graded.score,
      answers: graded.gradedAnswers,
    });

    await repository.clearProgress(sessionUser.uid, catalog.sessionId);

    return {
      attemptId: attempt.attemptId,
      score: graded.score,
      correctCount: graded.correctCount,
      questionCount: graded.questionCount,
      rationales: graded.rationales,
      reviewUrl: `/${routeSegmentFromSessionType(sessionType)}/${sessionNumber}/review?attemptId=${attempt.attemptId}`,
    };
  }

  const reviewToken = await signReviewToken({
    sessionId: catalog.sessionId,
    sessionNumber: catalog.sessionNumber,
    sessionType,
  });

  return {
    reviewToken,
    score: graded.score,
    correctCount: graded.correctCount,
    questionCount: graded.questionCount,
    rationales: graded.rationales,
    reviewUrl: `/${routeSegmentFromSessionType(sessionType)}/${sessionNumber}/review?reviewToken=${reviewToken}`,
  };
}

export async function getReviewPayload(
  sessionType: SessionType,
  sessionNumber: number,
  params: { attemptId?: string; reviewToken?: string },
  sessionUser: SessionUser | null,
): Promise<GetReadingReviewResponse | GetListeningReviewResponse> {
  const repository = getRepository();
  const catalog = await repository.getCatalogByNumber(sessionType, sessionNumber);
  assertCatalog(catalog);

  if (params.attemptId) {
    if (!sessionUser) {
      throw new Error("Authentication required.");
    }

    const attempt = await repository.getAttemptById(params.attemptId);
    if (
      !attempt ||
      attempt.uid !== sessionUser.uid ||
      attempt.sessionId !== catalog.sessionId
    ) {
      throw new Error("Forbidden.");
    }
  } else if (params.reviewToken) {
    const payload = await verifyReviewToken(params.reviewToken);
    if (
      payload.sessionId !== catalog.sessionId ||
      payload.sessionType !== sessionType ||
      payload.sessionNumber !== sessionNumber
    ) {
      throw new Error("Forbidden.");
    }
  } else {
    throw new Error("Review credential is required.");
  }

  const review = await repository.getReviewBySessionId(catalog.sessionId);
  if (!review) {
    throw new Error("Review content not found.");
  }

  if (sessionType === "reading") {
    const payload = review as ReadingReviewDoc;
    return {
      sessionId: catalog.sessionId,
      sessionNumber: catalog.sessionNumber,
      titleIt: catalog.titleIt,
      answerKey: payload.answerKey,
      reviewBody: payload.reviewBody,
      wordGlossary: payload.wordGlossary,
    };
  }

  const payload = review as ListeningReviewDoc;
  return {
    sessionId: catalog.sessionId,
    sessionNumber: catalog.sessionNumber,
    titleIt: catalog.titleIt,
    answerKey: payload.answerKey,
    transcript: payload.transcript,
    wordGlossary: payload.wordGlossary,
  };
}

export async function getHistory(sessionUser: SessionUser): Promise<GetHistoryResponse> {
  const repository = getRepository();
  const attempts = await repository.listAttempts(sessionUser.uid);

  return {
    items: await Promise.all(
      attempts.map(async (attempt) => {
        const catalog = await repository.getCatalogByNumber(
          attempt.sessionType,
          attempt.sessionNumber,
        );

        return {
          attemptId: attempt.attemptId,
          sessionType: attempt.sessionType,
          sessionNumber: attempt.sessionNumber,
          titleIt: catalog?.titleIt || attempt.sessionId,
          startedAt: toIsoString(attempt.startedAt),
          status: attempt.status,
          score: attempt.score,
        };
      }),
    ),
  };
}

function toNoteItem(item: NoteDoc): NoteItem {
  return {
    noteId: item.noteId,
    sessionId: item.sessionId,
    sessionType: item.sessionType,
    title: item.title,
    body: item.body,
    tags: item.tags,
    createdAt: toIsoString(item.createdAt),
    updatedAt: toIsoString(item.updatedAt),
  };
}

export async function getNotes(
  sessionUser: SessionUser,
  filters?: { sessionId?: string; tag?: string },
): Promise<GetNotesResponse> {
  const repository = getRepository();
  const items = await repository.listNotes(sessionUser.uid, filters);
  return {
    items: items.map(toNoteItem),
  };
}

export async function createNote(
  sessionUser: SessionUser,
  input: PostNoteRequest,
) {
  const repository = getRepository();
  const item = await repository.createNote(sessionUser.uid, input);
  return { item: toNoteItem(item) };
}

export async function updateNote(
  sessionUser: SessionUser,
  noteId: string,
  input: PatchNoteRequest,
) {
  const repository = getRepository();
  const item = await repository.updateNote(sessionUser.uid, noteId, input);
  if (!item) {
    throw new Error("Note not found.");
  }

  return { item: toNoteItem(item) };
}

export async function deleteNote(sessionUser: SessionUser, noteId: string) {
  const repository = getRepository();
  const ok = await repository.deleteNote(sessionUser.uid, noteId);
  if (!ok) {
    throw new Error("Note not found.");
  }
}

export async function getProgress(
  sessionUser: SessionUser,
  sessionId: string,
): Promise<GetProgressResponse> {
  const repository = getRepository();
  const existing = await repository.getProgress(sessionUser.uid, sessionId);

  return {
    sessionId,
    sessionType: sessionTypeFromSessionId(sessionId),
    currentQuestionIndex: existing?.currentQuestionIndex ?? 0,
    selectedAnswers: existing?.selectedAnswers ?? {},
    uiState: existing?.uiState ?? {},
    draftMemoState: existing?.draftMemoState ?? [],
    updatedAt: existing ? toIsoString(existing.updatedAt) : new Date(0).toISOString(),
  };
}

export async function putProgress(
  sessionUser: SessionUser,
  sessionId: string,
  input: PutProgressRequest,
) {
  const repository = getRepository();
  await repository.putProgress({
    uid: sessionUser.uid,
    sessionId,
    sessionType: sessionTypeFromSessionId(sessionId),
    currentQuestionIndex: input.currentQuestionIndex,
    selectedAnswers: input.selectedAnswers,
    uiState: input.uiState,
    draftMemoState: input.draftMemoState,
    updatedAt: new Date().toISOString(),
  });
}
