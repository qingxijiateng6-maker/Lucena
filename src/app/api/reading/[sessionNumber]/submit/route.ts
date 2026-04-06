import type { NextRequest } from "next/server";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { requireAllowedOrigin, requireJsonBody } from "@/lib/api/request";
import { responseFromError } from "@/lib/api/error-mapping";
import { jsonOk } from "@/lib/api/responses";
import { parseSessionNumber, submitSessionSchema } from "@/lib/validation/schemas";
import { submitSession } from "@/lib/sessions/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionNumber: string }> },
) {
  try {
    requireAllowedOrigin(request);
    const body = await requireJsonBody(request, submitSessionSchema);
    const user = await getOptionalSessionUser();
    const { sessionNumber } = await params;
    return jsonOk(
      await submitSession(
        "reading",
        parseSessionNumber(sessionNumber),
        body.answers,
        user,
      ),
    );
  } catch (error) {
    return responseFromError(error);
  }
}
