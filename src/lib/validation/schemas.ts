import { z } from "zod";

export const choiceIdSchema = z.enum(["A", "B", "C", "D"]);

export const sessionTypeSchema = z.enum(["reading", "listening"]);

export const authSessionSchema = z.object({
  idToken: z.string().min(1),
});

export const submitSessionSchema = z.object({
  answers: z.record(z.string(), choiceIdSchema),
});

export const createNoteSchema = z.object({
  sessionId: z.string().min(1),
  sessionType: sessionTypeSchema,
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(2000),
  tags: z.array(z.string().trim().min(1).max(20)).max(10),
});

export const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(80).optional(),
    body: z.string().trim().min(1).max(2000).optional(),
    tags: z.array(z.string().trim().min(1).max(20)).max(10).optional(),
  })
  .refine((value) => value.title || value.body || value.tags, {
    message: "At least one field must be updated.",
  });

export const progressSchema = z.object({
  currentQuestionIndex: z.number().int().min(0),
  selectedAnswers: z.record(z.string(), choiceIdSchema),
  uiState: z.object({
    readingQuestionPanelOpen: z.boolean().optional(),
    listeningPlaybackStarted: z.boolean().optional(),
  }),
  draftMemoState: z.array(
    z.object({
      title: z.string().max(80),
      body: z.string().max(2000),
      tags: z.array(z.string().max(20)).max(10),
    }),
  ),
});

export const reviewQuerySchema = z
  .object({
    attemptId: z.string().min(1).optional(),
    reviewToken: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.attemptId) !== Boolean(value.reviewToken), {
    message: "Provide either attemptId or reviewToken.",
  });

export function parseSessionNumber(value: string) {
  const sessionNumber = Number(value);
  if (!Number.isInteger(sessionNumber) || sessionNumber <= 0) {
    throw new Error("Invalid session number.");
  }

  return sessionNumber;
}
