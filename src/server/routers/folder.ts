import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { promises as fs } from "node:fs";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
import {
  getFolder,
  getFolders,
  getVideoFile,
  invalidateVideoScan,
  listFolderTree,
  listVideos,
  resolveVideoPath,
  videoSubPath,
} from "@/server/config/folders";
import {
  isFavorite,
  readFavorites,
  setFavorite,
} from "@/server/data/favorites";
import {
  listVideosInputSchema,
  listVideosOutputSchema,
  videoFileSchema,
  videoFolderNodeSchema,
  videoFolderSchema,
  videoRefSchema,
} from "@/schemas/video";

export const folderRouter = router({
  /** Configured source folders (id + label only — no fs paths leak out). */
  list: publicProcedure
    .output(z.array(videoFolderSchema))
    .query(() => getFolders().map(({ id, label }) => ({ id, label }))),

  /** All video files inside one configured folder. */
  videos: publicProcedure
    .input(listVideosInputSchema)
    .output(listVideosOutputSchema)
    .query(async ({ input }) => {
      const folder = getFolder(input.folderId);
      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Unknown folder" });
      }
      const all = await listVideos(folder);

      const scoped =
        input.subPath === undefined
          ? all
          : all.filter((v) => videoSubPath(v.relPath) === input.subPath);

      const term = input.search?.toLowerCase();
      const matched = term
        ? scoped.filter(
            (v) =>
              v.name.toLowerCase().includes(term) ||
              v.relPath.toLowerCase().includes(term),
          )
        : scoped;

      const total = matched.length;
      const start = input.page * input.pageSize;
      const videos = matched.slice(start, start + input.pageSize);

      return {
        folder: { id: folder.id, label: folder.label, videoCount: total },
        videos,
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /** The folder's directory tree (for Explorer-style drill-down navigation). */
  tree: publicProcedure
    .input(z.object({ folderId: z.string().min(1) }))
    .output(z.array(videoFolderNodeSchema))
    .query(async ({ input }) => {
      const folder = getFolder(input.folderId);
      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Unknown folder" });
      }
      return listFolderTree(folder);
    }),

  /** Single video's metadata by id (used by the watch page). */
  video: publicProcedure
    .input(
      z.object({ folderId: z.string().min(1), videoId: z.string().min(1) }),
    )
    .output(videoFileSchema)
    .query(async ({ input }) => {
      const folder = getFolder(input.folderId);
      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Unknown folder" });
      }
      const video = await getVideoFile(folder, input.videoId);
      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Unknown video" });
      }
      return video;
    }),

  /** Favourited videos across all folders (stale entries are skipped). */
  favorites: protectedProcedure
    .output(z.array(z.object({ folderId: z.string(), video: videoFileSchema })))
    .query(async () => {
      const resolved = await Promise.all(
        (await readFavorites()).map(async ({ folderId, videoId }) => {
          const folder = getFolder(folderId);
          const video = folder && (await getVideoFile(folder, videoId));
          return video ? { folderId, video } : null;
        }),
      );
      return resolved.filter((f) => f !== null);
    }),

  isFavorite: protectedProcedure
    .input(videoRefSchema)
    .output(z.boolean())
    .query(({ input }) => isFavorite(input)),

  setFavorite: protectedProcedure
    .input(videoRefSchema.extend({ favorite: z.boolean() }))
    .output(z.boolean())
    .mutation(({ input: { favorite, ...ref } }) => setFavorite(ref, favorite)),

  /** Permanently delete a video file from disk (no trash, no undo). */
  delete: protectedProcedure
    .input(videoRefSchema)
    .mutation(async ({ input }) => {
      const folder = getFolder(input.folderId);
      const resolved = folder && resolveVideoPath(folder, input.videoId);
      if (!resolved) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Unknown video" });
      }
      await fs.unlink(resolved.absPath);
      invalidateVideoScan(input.folderId);
      await setFavorite(input, false);
    }),
});
