import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data, error: null }, init);
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { data: null, error: { code: "VALIDATION_ERROR", message, details } },
    { status: 400 },
  );
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json(
    { data: null, error: { code: "UNAUTHORIZED", message } },
    { status: 401 },
  );
}

export function notFound(message = "Not found") {
  return NextResponse.json(
    { data: null, error: { code: "NOT_FOUND", message } },
    { status: 404 },
  );
}
