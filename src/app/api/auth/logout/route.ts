import type { NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { requireAllowedOrigin } from "@/lib/api/request";
import { noContent } from "@/lib/api/responses";
import { responseFromError } from "@/lib/api/error-mapping";

export async function POST(request: NextRequest) {
  try {
    requireAllowedOrigin(request);
    await clearSessionCookie();
    return noContent();
  } catch (error) {
    return responseFromError(error);
  }
}
