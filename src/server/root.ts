import { router, createCallerFactory } from "@/server/trpc";
import { healthRouter } from "@/server/routers/health";
import { userRouter } from "@/server/routers/user";
import { folderRouter } from "@/server/routers/folder";
import { authRouter } from "@/server/routers/auth";

/** The application's root tRPC router — the single source of API types. */
export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  user: userRouter,
  folder: folderRouter,
});

export type AppRouter = typeof appRouter;

/** Server-side caller factory for RSC / tests (no HTTP round-trip). */
export const createCaller = createCallerFactory(appRouter);
