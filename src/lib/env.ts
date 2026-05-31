import { z } from "zod";

/**
 * Centralized, type-safe environment access.
 *
 * Server-only vars must NOT be prefixed with NEXT_PUBLIC_.
 * Client-exposed vars MUST be prefixed with NEXT_PUBLIC_ and listed in
 * `clientSchema` so they are inlined by Next at build time.
 */
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  AUTH_SECRET: z.string().min(1).optional(),
  /** Login credentials (simple single-user auth). Default admin/admin. */
  AUTH_USERNAME: z.string().min(1).optional(),
  AUTH_PASSWORD: z.string().min(1).optional(),
  /**
   * Set to "true" when serving over plain HTTP (no TLS) so the session cookie
   * is NOT marked Secure — otherwise the browser drops it and login fails.
   */
  AUTH_INSECURE_COOKIE: z.string().optional(),
  /**
   * Video source folders. Server-only (filesystem paths).
   * Format: `Label|/abs/path` entries separated by `;`.
   * Example: `Movies|/Users/me/Movies;Talks|/data/talks`
   * Parsed into structured config in src/server/config/folders.ts.
   */
  VIDEO_FOLDERS: z.string().optional(),
});

const clientSchema = z.object({
  // Falls back to the default for blank OR invalid values (e.g. a hostname
  // entered without an https:// scheme) so a cosmetic misconfig never breaks
  // the build/runtime — the app uses relative URLs in the browser anyway.
  NEXT_PUBLIC_APP_URL: z
    .url()
    .default("http://localhost:3000")
    .catch("http://localhost:3000"),
});

const merged = serverSchema.merge(clientSchema);

/**
 * On the client, `process.env` only contains NEXT_PUBLIC_* keys (inlined),
 * so we must reference them statically. We build the raw object explicitly
 * rather than spreading `process.env`.
 */
// Treat blank env vars ("") as unset, so schema defaults / .optional() apply
// (e.g. an empty NEXT_PUBLIC_APP_URL falls back to its default instead of
// failing url validation).
const blankToUndef = (v: string | undefined): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  AUTH_SECRET: blankToUndef(process.env.AUTH_SECRET),
  AUTH_USERNAME: blankToUndef(process.env.AUTH_USERNAME),
  AUTH_PASSWORD: blankToUndef(process.env.AUTH_PASSWORD),
  AUTH_INSECURE_COOKIE: blankToUndef(process.env.AUTH_INSECURE_COOKIE),
  VIDEO_FOLDERS: blankToUndef(process.env.VIDEO_FOLDERS),
  NEXT_PUBLIC_APP_URL: blankToUndef(process.env.NEXT_PUBLIC_APP_URL),
};

const parsed = merged.safeParse(rawEnv);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    z.flattenError(parsed.error).fieldErrors,
  );
  throw new Error("Invalid environment variables. See errors above.");
}

export const env = parsed.data;
export type Env = z.infer<typeof merged>;
