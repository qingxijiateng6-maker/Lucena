import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { isAllowedOrigin } from "@/lib/security/origin";

function withEnv<T>(values: Record<string, string | undefined>, run: () => T) {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return run();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("allows same-origin preview requests without hardcoding each preview URL", () => {
  const request = new NextRequest("https://italian-learning-app-git-feature-x.vercel.app/api/notes");

  const allowed = withEnv(
    {
      NEXT_PUBLIC_APP_ORIGIN: "https://italian.example.com",
      APP_ALLOWED_ORIGINS: "",
      APP_ALLOWED_ORIGIN_SUFFIXES: "",
      VERCEL_URL: "italian-learning-app-git-feature-x.vercel.app",
    },
    () =>
      isAllowedOrigin(
        "https://italian-learning-app-git-feature-x.vercel.app",
        request,
      ),
  );

  assert.equal(allowed, true);
});

test("allows explicitly configured staging origins", () => {
  const request = new NextRequest("https://staging.italian.example.com/api/notes");

  const allowed = withEnv(
    {
      NEXT_PUBLIC_APP_ORIGIN: "https://italian.example.com",
      APP_ALLOWED_ORIGINS: "https://staging.italian.example.com, https://qa.italian.example.com",
      APP_ALLOWED_ORIGIN_SUFFIXES: "",
      VERCEL_URL: undefined,
    },
    () => isAllowedOrigin("https://qa.italian.example.com", request),
  );

  assert.equal(allowed, true);
});

test("allows configured preview suffixes but still blocks unrelated origins", () => {
  const request = new NextRequest("https://italian-learning-app-git-pr-12.vercel.app/api/notes");

  const [previewAllowed, attackerBlocked] = withEnv(
    {
      NEXT_PUBLIC_APP_ORIGIN: "https://italian.example.com",
      APP_ALLOWED_ORIGINS: "",
      APP_ALLOWED_ORIGIN_SUFFIXES: ".vercel.app",
      VERCEL_URL: undefined,
    },
    () => [
      isAllowedOrigin("https://italian-learning-app-git-pr-12.vercel.app", request),
      isAllowedOrigin("https://evil.example.com", request),
    ],
  );

  assert.equal(previewAllowed, true);
  assert.equal(attackerBlocked, false);
});
