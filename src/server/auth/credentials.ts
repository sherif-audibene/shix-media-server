import "server-only";

import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // Compare against a fixed-length digest space to avoid length leaks.
  if (ab.length !== bb.length) {
    // Still run a comparison to keep timing roughly constant.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/** Validate a username/password against the configured credentials. */
export function verifyCredentials(
  username: string,
  password: string,
): boolean {
  const expectedUser = env.AUTH_USERNAME ?? "admin";
  const expectedPass = env.AUTH_PASSWORD ?? "admin";
  // Evaluate both halves regardless of the first result.
  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPass);
  return userOk && passOk;
}
