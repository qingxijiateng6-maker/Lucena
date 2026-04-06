export type SessionType = "reading" | "listening";
export type ChoiceId = "A" | "B" | "C" | "D";

export type TimestampLike =
  | string
  | Date
  | {
      toDate(): Date;
    };

export interface UserDoc {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface SessionCatalogDoc {
  sessionId: string;
  sessionType: SessionType;
  sessionNumber: number;
  titleIt: string;
  titleJa: string | null;
  theme: string;
  heroIllustrationPath: string | null;
  isPublished: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface ReadingLearningSentence {
  sentenceId: string;
  text: string;
}

export interface ReadingLearningParagraph {
  paragraphIndex: number;
  sentences: ReadingLearningSentence[];
}

export interface ReadingLearningDoc {
  sessionId: string;
  body: {
    paragraphs: ReadingLearningParagraph[];
    wordCount: number;
  };
  questions: Array<{
    questionId: string;
    type: "main_idea" | "detail" | "reference_logic";
    prompt: string;
    choices: Array<{
      choiceId: ChoiceId;
      text: string;
    }>;
  }>;
}

export interface ListeningLearningDoc {
  sessionId: string;
  audio: {
    audioUrl: string;
    durationSec: number;
    kind: "conversation" | "lecture";
  };
  questions: Array<{
    questionId: string;
    type: "detail" | "gist" | "speaker_intent" | "number_info";
    prompt: string;
    choices: Array<{
      choiceId: ChoiceId;
      text: string;
    }>;
  }>;
}

export interface ReviewGrammarPoint {
  label: string;
  explanationJa: string;
}

export interface ReviewVocabNote {
  label: string;
  explanationJa: string;
}

export interface ReadingReviewDoc {
  sessionId: string;
  answerKey: Array<{
    questionId: string;
    correctChoiceId: ChoiceId;
    shortRationaleJa: string;
  }>;
  reviewBody: {
    paragraphs: Array<{
      paragraphIndex: number;
      sentences: Array<{
        sentenceId: string;
        text: string;
        translation: string;
        analysis: {
          structure: string;
          grammarPoints: ReviewGrammarPoint[];
          vocabNotes: ReviewVocabNote[];
        };
        ttsText: string;
      }>;
    }>;
  };
  wordGlossary: WordGlossaryItem[];
}

export interface ListeningReviewDoc {
  sessionId: string;
  answerKey: Array<{
    questionId: string;
    correctChoiceId: ChoiceId;
    shortRationaleJa: string;
  }>;
  transcript: {
    segments: Array<{
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
    }>;
  };
  wordGlossary: WordGlossaryItem[];
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

export interface AttemptDoc {
  attemptId: string;
  uid: string;
  sessionId: string;
  sessionType: SessionType;
  sessionNumber: number;
  startedAt: TimestampLike;
  completedAt: TimestampLike | null;
  status: "in_progress" | "completed";
  score: number | null;
  correctCount: number | null;
  questionCount: number;
  answers: Array<{
    questionId: string;
    selectedChoiceId: ChoiceId | null;
    isCorrect: boolean | null;
  }>;
}

export interface NoteDoc {
  noteId: string;
  uid: string;
  sessionId: string;
  sessionType: SessionType;
  title: string;
  body: string;
  tags: string[];
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface SavedProgressDoc {
  uid: string;
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
  updatedAt: TimestampLike;
}

export interface LearningBundle {
  catalog: SessionCatalogDoc;
  learning: ReadingLearningDoc | ListeningLearningDoc;
}

export interface ReviewBundle {
  catalog: SessionCatalogDoc;
  review: ReadingReviewDoc | ListeningReviewDoc;
}
