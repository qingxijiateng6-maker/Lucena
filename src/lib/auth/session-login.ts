import type { DecodedIdToken } from "firebase-admin/auth";
import type { UserDoc } from "@/types/session";

interface CompleteSessionLoginDependencies {
  verifyIdToken: (idToken: string) => Promise<DecodedIdToken>;
  createSessionCookie: (idToken: string) => Promise<string>;
  setSessionCookie: (sessionCookie: string) => Promise<void>;
  upsertUser: (user: UserDoc) => Promise<void>;
  logger?: {
    warn: (message: string, meta?: Record<string, unknown>) => void;
  };
}

function toSessionUserDoc(decoded: DecodedIdToken): UserDoc {
  const now = new Date().toISOString();

  return {
    uid: decoded.uid,
    displayName: decoded.name || decoded.email || "Utente",
    email: decoded.email || "",
    photoURL: decoded.picture || null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function completeSessionLogin(
  idToken: string,
  dependencies: CompleteSessionLoginDependencies,
) {
  const decoded = await dependencies.verifyIdToken(idToken);
  const sessionCookie = await dependencies.createSessionCookie(idToken);

  await dependencies.setSessionCookie(sessionCookie);

  try {
    await dependencies.upsertUser(toSessionUserDoc(decoded));
  } catch (error) {
    dependencies.logger?.warn(
      "[auth/session] Failed to persist user profile. Continuing with authenticated session.",
      {
        uid: decoded.uid,
        error: error instanceof Error ? error.message : String(error),
      },
    );
  }

  return decoded;
}

export { toSessionUserDoc };
