# next-trpc-grid

End-to-end typed Next.js starter.

## Stack

| Concern        | Choice                                                    |
| -------------- | --------------------------------------------------------- |
| Framework      | Next.js 15 (App Router) · React 19 · TypeScript (strict)  |
| API            | tRPC v11 (no REST) + SuperJSON                            |
| Validation     | Zod v4 (env, request/response, domain models)            |
| Data / state   | TanStack React Query (via tRPC)                          |
| UI             | Material UI v7 + Emotion (`*.styled.tsx` per component)    |
| Grid           | TanStack React Table v8                                   |
| i18n           | next-intl v4 — `en, de, fr, es, it, ja`                   |
| Stories        | Storybook 9 (`@storybook/nextjs`)                        |
| Package manager| pnpm                                                     |

## Getting started

```bash
pnpm install        # also fetches the ffmpeg binary (ffmpeg-static)
cp .env.example .env.local
pnpm dev            # http://localhost:3000
pnpm storybook      # http://localhost:6006
```

`ffmpeg-static` runs an install script to download its binary. pnpm blocks
dependency scripts by default, so it is whitelisted via
`pnpm.onlyBuiltDependencies` in `package.json` — a plain `pnpm install` is
enough. If thumbnails 404, run `pnpm rebuild ffmpeg-static`.

### Video browsing

Configure source folders in `.env.local`:

```
VIDEO_FOLDERS=Movies|/abs/path/movies;Talks|/abs/path/talks
```

- `/folders` lists configured folders → `/folders/[id]` shows a thumbnail grid.
- Clicking a card opens `/watch/[folderId]/[videoId]` (player + "more in this
  folder" rail).
- `GET /api/stream` streams files with HTTP Range support (seeking).
- `GET /api/thumbnail` returns an ffmpeg-generated poster frame, cached on disk
  under the OS temp dir (keyed by path + mtime + size).
- All file access is sandboxed to the configured folders (traversal → 403).

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — Next + Storybook ESLint
- `pnpm format` — Prettier
- `pnpm storybook` / `pnpm build-storybook`

## Layout

```
src/
  app/[locale]/            # localized routes (layout, home, users)
    api/trpc/[trpc]/       # single fetch route handler for the whole API
  components/
    providers/             # MUI + tRPC/React Query client providers
    UserTable/             # *.tsx + *.styled.tsx + *.stories.tsx (co-located)
  server/                  # tRPC: trpc.ts (init + middleware), context, routers, root
    routers/               # health, user
    data/                  # in-memory mock data source
  trpc/                    # client (react.tsx), server caller, shared helpers
  schemas/                 # Zod domain models
  i18n/                    # routing, navigation, request config
  lib/                     # env (Zod-validated), MUI theme
  middleware.ts            # next-intl locale middleware
messages/                  # 6 locale bundles
.storybook/                # main.ts + preview.tsx (MUI + next-intl decorators)
```

## Conventions

- **No REST.** Every server call goes through tRPC; `AppRouter` is the single
  source of API types. Compose procedures from `publicProcedure` /
  `protectedProcedure` (logging + auth middleware in `src/server/trpc.ts`).
- **Zod everywhere.** Inputs and outputs of procedures are validated; env is
  validated at startup in `src/lib/env.ts`.
- **Styled co-location.** Each component keeps its Emotion `styled` API in a
  sibling `*.styled.tsx`.
- **Controlled presentational components.** `UserTable` is data-agnostic;
  `UserTableContainer` wires it to tRPC. This keeps Storybook fixture-driven.
- **Path alias.** Import from `@/*` (maps to `src/*`).
```
