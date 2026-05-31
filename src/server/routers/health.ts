import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc";

export const healthRouter = router({
  ping: publicProcedure
    .output(z.object({ status: z.literal("ok"), now: z.date() }))
    .query(() => ({ status: "ok" as const, now: new Date() })),
});
