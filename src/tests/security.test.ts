import assert from "node:assert/strict";
import test from "node:test";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { responseFromError } from "@/lib/api/error-mapping";
import { getLearningPayload } from "@/lib/sessions/service";
import { reviewQuerySchema } from "@/lib/validation/schemas";

test("shared auth guard rejects unauthenticated access for history/notes/progress", async () => {
  const response = responseFromError(
    (() => {
      try {
        requireAuthenticatedUser(null);
        return new Error("Expected auth guard to throw.");
      } catch (error) {
        return error;
      }
    })(),
  );

  assert.equal(response.status, 401);
});

test("reading learning payload does not expose review-only fields", async () => {
  const payload = await getLearningPayload("reading", 1);
  const serialized = JSON.stringify(payload);

  assert.equal(serialized.includes("correctChoiceId"), false);
  assert.equal(serialized.includes("\"translation\""), false);
  assert.equal(serialized.includes("\"answerKey\""), false);
});

test("review access requires either attemptId or reviewToken", async () => {
  const result = reviewQuerySchema.safeParse({});
  assert.equal(result.success, false);
});
