import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { SessionType } from "@/types/session";

export interface ReviewTokenPayload extends JWTPayload {
  sessionId: string;
  sessionNumber: number;
  sessionType: SessionType;
}

function getSecret() {
  return new TextEncoder().encode(
    process.env.REVIEW_TOKEN_SECRET || "dev-review-token-secret-change-me",
  );
}

export async function signReviewToken(payload: ReviewTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(getSecret());
}

export async function verifyReviewToken(token: string) {
  const verified = await jwtVerify<ReviewTokenPayload>(token, getSecret());
  return verified.payload;
}
