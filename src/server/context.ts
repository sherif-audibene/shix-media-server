import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import {
  SESSION_COOKIE,
  readCookie,
  verifySessionToken,
} from "@/server/auth/session";

/** Minimal authenticated user shape resolved from the session. */
export interface SessionUser {
  id: string;
  name: string;
  role: "admin" | "editor" | "viewer";
}

export interface Context {
  user: SessionUser | null;
  headers: Headers;
  /** Mutable response headers — used to set/clear the session cookie. */
  resHeaders: Headers;
}

/** Builds the per-request tRPC context from the signed session cookie. */
export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<Context> {
  const headers = opts.req.headers;
  const token = readCookie(headers.get("cookie"), SESSION_COOKIE);
  const payload = verifySessionToken(token);
  const user: SessionUser | null = payload
    ? { id: payload.u, name: payload.u, role: "admin" }
    : null;

  return { user, headers, resHeaders: opts.resHeaders };
}
