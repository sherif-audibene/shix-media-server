import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc";
import { verifyCredentials } from "@/server/auth/credentials";
import {
  buildClearCookieHeader,
  buildSessionCookie,
  createSessionToken,
} from "@/server/auth/session";

const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["admin", "editor", "viewer"]),
});

const loginInputSchema = z.object({
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(200),
});

export const authRouter = router({
  /** Current session user, or null. */
  me: publicProcedure
    .output(sessionUserSchema.nullable())
    .query(({ ctx }) => ctx.user),

  /** Validate credentials and set the session cookie. */
  login: publicProcedure
    .input(loginInputSchema)
    .output(z.object({ user: sessionUserSchema }))
    .mutation(({ ctx, input }) => {
      if (!verifyCredentials(input.username, input.password)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }
      const token = createSessionToken(input.username);
      ctx.resHeaders.append("set-cookie", buildSessionCookie(token));
      return {
        user: { id: input.username, name: input.username, role: "admin" },
      };
    }),

  /** Clear the session cookie. */
  logout: publicProcedure
    .output(z.object({ ok: z.literal(true) }))
    .mutation(({ ctx }) => {
      ctx.resHeaders.append("set-cookie", buildClearCookieHeader());
      return { ok: true };
    }),
});
