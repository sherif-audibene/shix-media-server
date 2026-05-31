import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "@/i18n/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";
import type { SessionUser } from "@/server/context";

/** Resolve the logged-in user from the session cookie (RSC-friendly). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  return payload ? { id: payload.u, name: payload.u, role: "admin" } : null;
});

/**
 * Guard for protected pages: returns the user, or redirects to /login
 * (locale-aware) when unauthenticated. Call after setRequestLocale().
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user) return user;
  const { getLocale } = await import("next-intl/server");
  redirect({ href: "/login", locale: await getLocale() });
  // redirect() throws — unreachable, but needed to satisfy the return type.
  throw new Error("unreachable");
}
