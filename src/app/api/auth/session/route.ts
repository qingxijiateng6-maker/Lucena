import type { NextRequest } from "next/server";
import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import {
  createSessionCookieFromIdToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { completeSessionLogin } from "@/lib/auth/session-login";
import { requireAllowedOrigin, requireJsonBody } from "@/lib/api/request";
import { authSessionSchema } from "@/lib/validation/schemas";
import { responseFromError } from "@/lib/api/error-mapping";
import { noContent } from "@/lib/api/responses";
import { getRepository } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    console.log("[auth/session] Incoming session exchange request.");

    if (!isFirebaseAdminConfigured()) {
      throw new Error("Firebase Admin is not configured.");
    }

    requireAllowedOrigin(request);
    const body = await requireJsonBody(request, authSessionSchema);

    const auth = getAdminAuth();
    await completeSessionLogin(body.idToken, {
      verifyIdToken: (idToken) => auth.verifyIdToken(idToken),
      createSessionCookie: createSessionCookieFromIdToken,
      setSessionCookie,
      upsertUser: (user) => getRepository().upsertUser(user),
      logger: {
        warn: (message, meta) => console.warn(message, meta),
      },
    });

    console.log("[auth/session] Session exchange completed successfully.");
    return noContent();
  } catch (error) {
    console.error("[auth/session] Session exchange failed.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return responseFromError(error);
  }
}
