import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { createCaller } from "@/server/root";
import type { Context } from "@/server/context";
import { getCurrentUser } from "@/server/auth/currentUser";

/**
 * Server-side tRPC caller for use inside React Server Components.
 * Calls procedures directly (no HTTP), reusing the same router & context.
 * Cookie mutations are no-ops here (RSC can't set headers on the caller);
 * login/logout always go through the HTTP route.
 */
const createServerContext = cache(async (): Promise<Context> => {
  const h = await headers();
  const user = await getCurrentUser();
  return { headers: h, resHeaders: new Headers(), user };
});

export const trpc = createCaller(createServerContext);
