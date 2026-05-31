import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export const SESSION_COOKIE = "app_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

const secret = env.AUTH_SECRET ?? "dev-insecure-secret-change-me";

export interface SessionPayload {
  /** username */
  u: string;
  /** issued-at (epoch ms) */
  iat: number;
}

function sign(data: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

/** Create a tamper-proof `<payload>.<hmac>` session token. */
export function createSessionToken(username: string): string {
  const body = Buffer.from(
    JSON.stringify({ u: username, iat: Date.now() } satisfies SessionPayload),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verify signature + expiry, returning the payload or null. */
export function verifySessionToken(
  token: string | undefined,
): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (
      typeof payload.u !== "string" ||
      typeof payload.iat !== "number" ||
      Date.now() - payload.iat > SESSION_MAX_AGE * 1000
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

const secureFlag = env.NODE_ENV === "production" ? "; Secure" : "";

/** Serialized Set-Cookie value that stores the session. */
export function buildSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secureFlag}`;
}

/** Serialized Set-Cookie value that clears the session. */
export function buildClearCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secureFlag}`;
}

/** Extract a single cookie value from a raw Cookie header. */
export function readCookie(
  cookieHeader: string | null,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}
