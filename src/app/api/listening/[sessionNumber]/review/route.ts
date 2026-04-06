import type { NextRequest } from "next/server";
import { jsonOk } from "@/lib/api/responses";
import { responseFromError } from "@/lib/api/error-mapping";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { parseSessionNumber, reviewQuerySchema } from "@/lib/validation/schemas";
import { getReviewPayload } from "@/lib/sessions/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionNumber: string }> },
) {
  try {
    const { sessionNumber } = await params;
    const query = reviewQuerySchema.parse({
      attemptId: request.nextUrl.searchParams.get("attemptId") || undefined,
      reviewToken: request.nextUrl.searchParams.get("reviewToken") || undefined,
    });
    const user = await getOptionalSessionUser();
    return jsonOk(
      await getReviewPayload(
        "listening",
        parseSessionNumber(sessionNumber),
        query,
        user,
      ),
    );
  } catch (error) {
    return responseFromError(error);
  }
}
