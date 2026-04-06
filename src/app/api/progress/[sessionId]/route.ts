import type { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { responseFromError } from "@/lib/api/error-mapping";
import { jsonOk } from "@/lib/api/responses";
import { requireAllowedOrigin, requireJsonBody } from "@/lib/api/request";
import { progressSchema } from "@/lib/validation/schemas";
import { getProgress, putProgress } from "@/lib/sessions/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = requireAuthenticatedUser(await getOptionalSessionUser());
    const { sessionId } = await params;
    return jsonOk(await getProgress(user, sessionId));
  } catch (error) {
    return responseFromError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = requireAuthenticatedUser(await getOptionalSessionUser());
    requireAllowedOrigin(request);
    const body = await requireJsonBody(request, progressSchema);
    const { sessionId } = await params;
    await putProgress(user, sessionId, body);
    return jsonOk({ ok: true });
  } catch (error) {
    return responseFromError(error);
  }
}
