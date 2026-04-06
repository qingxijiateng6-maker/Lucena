/* docs/03_api_contracts.ts */

export type SessionType = "reading" | "listening";
export type ChoiceId = "A" | "B" | "C" | "D";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

/* =========================
   Auth
========================= */

export interface PostAuthSessionRequest {
  idToken: string;
}

export interface GetAuthMeResponseAuthenticated {
  authenticated: true;
  user: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string | null;
  };
}

export interface GetAuthMeResponseUnauthenticated {
  authenticated: false;
}

export type GetAuthMeResponse =
  | GetAuthMeResponseAuthenticated
  | GetAuthMeResponseUnauthenticated;

/* =========================
   Session list
========================= */

export interface SessionListItem {
  sessionId: string;
  sessionNumber: number;
  sessionType: SessionType;
  titleIt: string;
  heroIllustrationPath: string | null;
  isLearned: boolean;
}

export interface GetSessionsResponse {
  items: SessionListItem[];
}

/* =========================
   Reading learning
========================= */

export interface ReadingLearningSentence {
  sentenceId: string;
  text: string;
}

export interface ReadingLearningParagraph {
  paragraphIndex: number;
  sentences: ReadingLearningSentence[];
}

export interface ReadingLearningQuestion {
  questionId: string;
  type: "main_idea" | "detail" | "reference_logic";
  prompt: string;
  choices: Array<{
    choiceId: ChoiceId;
    text: string;
  }>;
}

export interface GetReadingLearningResponse {
  sessionId: string;
  sessionNumber: number;
  titleIt: string;
  body: {
    paragraphs: ReadingLearningParagraph[];
    wordCount: number;
  };
  questions: ReadingLearningQuestion[];
}

/* =========================
   Listening learning
========================= */

export interface ListeningLearningQuestion {
  questionId: string;
  type: "detail" | "gist" | "speaker_intent" | "number_info";
  prompt: string;
  choices: Array<{
    choiceId: ChoiceId;
    text: string;
  }>;
}

export interface GetListeningLearningResponse {
  sessionId: string;
  sessionNumber: number;
  titleIt: string;
  audio: {
    audioUrl: string;
    durationSec: number;
    kind: "conversation" | "lecture";
  };
  questions: ListeningLearningQuestion[];
}

/* =========================
   Submit
========================= */

export interface SubmitSessionRequest {
  answers: Record<string, ChoiceId>;
}

export interface SubmitSessionRationale {
  questionId: string;
  shortRationaleJa: string;
}

export interface SubmitSessionResponseAuthenticated {
  attemptId: string;
  score: number;
  correctCount: number;
  questionCount: number;
  rationales: SubmitSessionRationale[];
  reviewUrl: string;
}

export interface SubmitSessionResponseAnonymous {
  reviewToken: string;
  score: number;
  correctCount: number;
  questionCount: number;
  rationales: SubmitSessionRationale[];
  reviewUrl: string;
}

export type SubmitSessionResponse =
  | SubmitSessionResponseAuthenticated
  | SubmitSessionResponseAnonymous;

/* =========================
   Reading review
========================= */

export interface ReviewGrammarPoint {
  label: string;
  explanationJa: string;
}

export interface ReviewVocabNote {
  label: string;
  explanationJa: string;
}

export interface ReadingReviewSentence {
  sentenceId: string;
  text: string;
  translation: string;
  analysis: {
    structure: string;
    grammarPoints: ReviewGrammarPoint[];
    vocabNotes: ReviewVocabNote[];
  };
  ttsText: string;
}

export interface ReadingReviewParagraph {
  paragraphIndex: number;
  sentences: ReadingReviewSentence[];
}

export interface WordGlossaryItem {
  lemma: string;
  surfaceForms: string[];
  pos: string;
  morphology: string;
  meaningJa: string;
  collocations: Array<{
    it: string;
    ja: string;
  }>;
}

export interface GetReadingReviewResponse {
  sessionId: string;
  sessionNumber: number;
  titleIt: string;
  answerKey: Array<{
    questionId: string;
    correctChoiceId: ChoiceId;
    shortRationaleJa: string;
  }>;
  reviewBody: {
    paragraphs: ReadingReviewParagraph[];
  };
  wordGlossary: WordGlossaryItem[];
}

/* =========================
   Listening review
========================= */

export interface ListeningReviewSegment {
  segmentId: string;
  sentenceId: string;
  speakerId: string;
  speakerName: string;
  startSec: number;
  endSec: number;
  text: string;
  translation: string;
  analysis: {
    structure: string;
    grammarPoints: ReviewGrammarPoint[];
    vocabNotes: ReviewVocabNote[];
  };
}

export interface GetListeningReviewResponse {
  sessionId: string;
  sessionNumber: number;
  titleIt: string;
  answerKey: Array<{
    questionId: string;
    correctChoiceId: ChoiceId;
    shortRationaleJa: string;
  }>;
  transcript: {
    segments: ListeningReviewSegment[];
  };
  wordGlossary: WordGlossaryItem[];
}

/* =========================
   History
========================= */

export interface HistoryItem {
  attemptId: string;
  sessionType: SessionType;
  sessionNumber: number;
  titleIt: string;
  startedAt: string;
  status: "in_progress" | "completed";
  score: number | null;
}

export interface GetHistoryResponse {
  items: HistoryItem[];
}

/* =========================
   Notes
========================= */

export interface NoteItem {
  noteId: string;
  sessionId: string;
  sessionType: SessionType;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GetNotesResponse {
  items: NoteItem[];
}

export interface PostNoteRequest {
  sessionId: string;
  sessionType: SessionType;
  title: string;
  body: string;
  tags: string[];
}

export interface PostNoteResponse {
  item: NoteItem;
}

export interface PatchNoteRequest {
  title?: string;
  body?: string;
  tags?: string[];
}

export interface PatchNoteResponse {
  item: NoteItem;
}

/* =========================
   Progress
========================= */

export interface GetProgressResponse {
  sessionId: string;
  sessionType: SessionType;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, ChoiceId>;
  uiState: {
    readingQuestionPanelOpen?: boolean;
    listeningPlaybackStarted?: boolean;
  };
  draftMemoState: Array<{
    title: string;
    body: string;
    tags: string[];
  }>;
  updatedAt: string;
}

export interface PutProgressRequest {
  currentQuestionIndex: number;
  selectedAnswers: Record<string, ChoiceId>;
  uiState: {
    readingQuestionPanelOpen?: boolean;
    listeningPlaybackStarted?: boolean;
  };
  draftMemoState: Array<{
    title: string;
    body: string;
    tags: string[];
  }>;
}

export interface PutProgressResponse {
  ok: true;
}