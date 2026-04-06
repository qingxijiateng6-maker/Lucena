import type { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { responseFromError } from "@/lib/api/error-mapping";
import { jsonOk } from "@/lib/api/responses";
import { requireAllowedOrigin, requireJsonBody } from "@/lib/api/request";
import { createNoteSchema } from "@/lib/validation/schemas";
import { createNote, getNotes } from "@/lib/sessions/service";

export async function GET(request: NextRequest) {
  try {
    const user = requireAuthenticatedUser(await getOptionalSessionUser());
    return jsonOk(
      await getNotes(user, {
        sessionId: request.nextUrl.searchParams.get("sessionId") || undefined,
        tag: request.nextUrl.searchParams.get("tag") || undefined,
      }),
    );
  } catch (error) {
    return responseFromError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuthenticatedUser(await getOptionalSessionUser());
    requireAllowedOrigin(request);
    const body = await requireJsonBody(request, createNoteSchema);
    return jsonOk(await createNote(user, body), { status: 201 });
  } catch (error) {
    return responseFromError(error);
  }
}
