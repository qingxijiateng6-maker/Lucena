import type { NextRequest } from "next/server";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { responseFromError } from "@/lib/api/error-mapping";
import { jsonOk } from "@/lib/api/responses";
import { listSessions } from "@/lib/sessions/service";
import { sessionTypeSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    const sessionType = sessionTypeSchema.parse(
      request.nextUrl.searchParams.get("type"),
    );
    const user = await getOptionalSessionUser();
    return jsonOk(await listSessions(sessionType, user));
  } catch (error) {
    return responseFromError(error);
  }
}
