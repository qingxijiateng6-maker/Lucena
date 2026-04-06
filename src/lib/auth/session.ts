import { cookies } from "next/headers";
import type { SessionUser } from "@/types/auth";
import { getAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "italian_learning_session";
const SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 7;

function getSessionCookieOptions(): {
  expires: Date;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict";
  path: string;
} {
  return {
    expires: new Date(Date.now() + SESSION_EXPIRES_IN_MS),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  };
}

export async function createSessionCookieFromIdToken(idToken: string) {
  const auth = getAdminAuth();
  await auth.verifyIdToken(idToken);
  return auth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRES_IN_MS,
  });
}

export async function getOptionalSessionUser(): Promise<SessionUser | null> {
  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      displayName: decoded.name || decoded.email || "Utente",
      email: decoded.email || "",
      photoURL: decoded.picture || null,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(sessionCookie: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
