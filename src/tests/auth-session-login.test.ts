import assert from "node:assert/strict";
import test from "node:test";
import { completeSessionLogin, toSessionUserDoc } from "@/lib/auth/session-login";

test("toSessionUserDoc maps Firebase claims into the stored user shape", () => {
  const user = toSessionUserDoc({
    uid: "user-123",
    email: "user@example.com",
    name: "Test User",
    picture: "https://lh3.googleusercontent.com/a/test",
  } as never);

  assert.equal(user.uid, "user-123");
  assert.equal(user.displayName, "Test User");
  assert.equal(user.email, "user@example.com");
  assert.equal(user.photoURL, "https://lh3.googleusercontent.com/a/test");
  assert.equal(typeof user.createdAt, "string");
  assert.equal(typeof user.updatedAt, "string");
});

test("completeSessionLogin still authenticates when user persistence fails", async () => {
  const calls: string[] = [];
  const warnings: Array<Record<string, unknown> | undefined> = [];

  await completeSessionLogin("token-123", {
    verifyIdToken: async () => {
      calls.push("verifyIdToken");
      return {
        uid: "user-123",
        email: "user@example.com",
        name: "Test User",
        picture: null,
      } as never;
    },
    createSessionCookie: async () => {
      calls.push("createSessionCookie");
      return "session-cookie";
    },
    setSessionCookie: async (cookie) => {
      calls.push(`setSessionCookie:${cookie}`);
    },
    upsertUser: async () => {
      calls.push("upsertUser");
      throw new Error("Firestore unavailable");
    },
    logger: {
      warn: (_message, meta) => {
        calls.push("warn");
        warnings.push(meta);
      },
    },
  });

  assert.deepEqual(calls, [
    "verifyIdToken",
    "createSessionCookie",
    "setSessionCookie:session-cookie",
    "upsertUser",
    "warn",
  ]);
  assert.equal(warnings[0]?.uid, "user-123");
  assert.equal(warnings[0]?.error, "Firestore unavailable");
});
