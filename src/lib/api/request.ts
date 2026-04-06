import type { NextRequest } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { isAllowedOrigin } from "@/lib/security/origin";

export async function requireJsonBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Content-Type must be application/json.");
  }

  const raw = await request.json();
  return schema.parse(raw);
}

export function requireAllowedOrigin(request: NextRequest) {
  if (!isAllowedOrigin(request.headers.get("origin"), request)) {
    throw new Error("Invalid request origin.");
  }
}

export function getValidationMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message || "Validation failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error.";
}
