import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/types/api";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function noContent(init?: ResponseInit) {
  return new NextResponse(null, { status: 204, ...init });
}

export function jsonError(
  code: ApiErrorCode,
  message: string,
  status: number,
  init?: ResponseInit,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status, ...init },
  );
}
