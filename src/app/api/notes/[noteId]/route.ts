import type { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { responseFromError } from "@/lib/api/error-mapping";
import { jsonOk, noContent } from "@/lib/api/responses";
import { requireAllowedOrigin, requireJsonBody } from "@/lib/api/request";
import { updateNoteSchema } from "@/lib/validation/schemas";
import { deleteNote, updateNote } from "@/lib/sessions/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const user = requireAuthenticatedUser(await getOptionalSessionUser());
    requireAllowedOrigin(request);
    const body = await requireJsonBody(request, updateNoteSchema);
    const { noteId } = await params;
    return jsonOk(await updateNote(user, noteId, body));
  } catch (error) {
    return responseFromError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const user = requireAuthenticatedUser(await getOptionalSessionUser());
    requireAllowedOrigin(request);
    const { noteId } = await params;
    await deleteNote(user, noteId);
    return noContent();
  } catch (error) {
    return responseFromError(error);
  }
}
