import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/root";
import { createContext } from "@/server/context";

/**
 * Single Next.js Route Handler that serves the entire tRPC API over fetch.
 * Handles both GET (queries) and POST (mutations / batched calls).
 */
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: (opts) => createContext(opts),
    onError({ error, path }) {
      console.error(`[trpc] error on ${path ?? "<no-path>"}:`, error.message);
    },
  });

export { handler as GET, handler as POST };
