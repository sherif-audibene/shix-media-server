import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc";
import {
  getFolder,
  getFolders,
  getVideoFile,
  listSubfolders,
  listVideos,
  videoSubPath,
} from "@/server/config/folders";
import {
  listVideosInputSchema,
  listVideosOutputSchema,
  videoFileSchema,
  videoFolderSchema,
  videoSubfolderSchema,
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

  /** Distinct sub-directories inside a folder (for the sub-folder filter). */
  subfolders: publicProcedure
    .input(z.object({ folderId: z.string().min(1) }))
    .output(z.array(videoSubfolderSchema))
    .query(async ({ input }) => {
      const folder = getFolder(input.folderId);
      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Unknown folder" });
      }
      return listSubfolders(folder);
    }),

  /** Single video's metadata by id (used by the watch page). */
  video: publicProcedure
    .input(z.object({ folderId: z.string().min(1), videoId: z.string().min(1) }))
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
});
