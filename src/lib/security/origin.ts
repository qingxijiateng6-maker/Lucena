import type { NextRequest } from "next/server";

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function parseCsv(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((item) => trimTrailingSlash(item.trim()))
    .filter(Boolean);
}

function normalizeOrigin(origin: string) {
  try {
    return trimTrailingSlash(new URL(origin).origin);
  } catch {
    return trimTrailingSlash(origin);
  }
}

function getConfiguredOrigins(request: NextRequest) {
  const configured = new Set<string>();

  configured.add(normalizeOrigin(request.nextUrl.origin));

  if (process.env.NEXT_PUBLIC_APP_ORIGIN) {
    configured.add(normalizeOrigin(process.env.NEXT_PUBLIC_APP_ORIGIN));
  }

  if (process.env.VERCEL_URL) {
    configured.add(normalizeOrigin(`https://${process.env.VERCEL_URL}`));
  }

  for (const origin of parseCsv(process.env.APP_ALLOWED_ORIGINS)) {
    configured.add(normalizeOrigin(origin));
  }

  return configured;
}

function getAllowedHostnameSuffixes() {
  return parseCsv(process.env.APP_ALLOWED_ORIGIN_SUFFIXES).map((item) =>
    item.startsWith(".") ? item.toLowerCase() : `.${item.toLowerCase()}`,
  );
}

export function getExpectedOrigin(request: NextRequest) {
  return Array.from(getConfiguredOrigins(request))[0] || normalizeOrigin(request.nextUrl.origin);
}

export function isAllowedOrigin(origin: string | null, request: NextRequest) {
  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }

  const normalizedOrigin = normalizeOrigin(origin);
  if (getConfiguredOrigins(request).has(normalizedOrigin)) {
    return true;
  }

  const suffixes = getAllowedHostnameSuffixes();
  if (suffixes.length === 0) {
    return false;
  }

  try {
    const hostname = new URL(normalizedOrigin).hostname.toLowerCase();
    return suffixes.some((suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

export function getAllowedOriginsForDebug(request: NextRequest) {
  return {
    exact: Array.from(getConfiguredOrigins(request)),
    hostnameSuffixes: getAllowedHostnameSuffixes(),
  };
}
