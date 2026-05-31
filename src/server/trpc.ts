import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Context } from "@/server/context";

/**
 * tRPC instance initialization.
 * - SuperJSON transformer so Dates/Maps/etc. survive the wire.
 * - Zod errors are flattened into `error.data.zodError` for clients.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/** Logs every procedure call with its timing. */
const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;
  const status = result.ok ? "ok" : "error";
  console.log(`[trpc] ${type} ${path} — ${status} (${durationMs}ms)`);
  return result;
});

/** Rejects calls without an authenticated user; narrows ctx.user to non-null. */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const mergeRouters = t.mergeRouters;

/** Public procedure: logging only. */
export const publicProcedure = t.procedure.use(loggingMiddleware);

/** Protected procedure: logging + auth. `ctx.user` is guaranteed non-null. */
export const protectedProcedure = publicProcedure.use(authMiddleware);
