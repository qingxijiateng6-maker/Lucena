import { ZodError } from "zod";
import { jsonError } from "@/lib/api/responses";

export function responseFromError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(
      "BAD_REQUEST",
      error.issues[0]?.message || "Validation failed.",
      400,
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";

  if (message === "Authentication required.") {
    return jsonError("UNAUTHORIZED", message, 401);
  }

  if (message === "Forbidden." || message === "Invalid request origin.") {
    return jsonError("FORBIDDEN", message, 403);
  }

  if (
    message === "Session not found." ||
    message === "Learning content not found." ||
    message === "Review content not found." ||
    message === "Note not found."
  ) {
    return jsonError("NOT_FOUND", message, 404);
  }

  if (
    message === "Content-Type must be application/json." ||
    message === "Review credential is required." ||
    message === "Invalid session number."
  ) {
    return jsonError("BAD_REQUEST", message, 400);
  }

  return jsonError("INTERNAL_ERROR", message, 500);
}
