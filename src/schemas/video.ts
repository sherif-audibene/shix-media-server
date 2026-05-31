import { z } from "zod";

/** A configured source folder, as exposed to the client (no fs path). */
export const videoFolderSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  videoCount: z.number().int().min(0).optional(),
});
export type VideoFolder = z.infer<typeof videoFolderSchema>;

/** A single video file discovered inside a folder. */
export const videoFileSchema = z.object({
  /** base64url-encoded path relative to the folder root (URL-safe id). */
  id: z.string().min(1),
  name: z.string().min(1),
  /** Path relative to the folder root (for showing sub-directory context). */
  relPath: z.string(),
  ext: z.string(),
  mimeType: z.string(),
  size: z.number().int().min(0),
  modifiedAt: z.date(),
});
export type VideoFile = z.infer<typeof videoFileSchema>;

export const listVideosInputSchema = z.object({
  folderId: z.string().min(1),
  search: z.string().trim().max(200).optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(500).default(100),
});
export type ListVideosInput = z.infer<typeof listVideosInputSchema>;

export const listVideosOutputSchema = z.object({
  folder: videoFolderSchema,
  videos: z.array(videoFileSchema),
  /** Total matching the search, before pagination. */
  total: z.number().int().min(0),
  page: z.number().int().min(0),
  pageSize: z.number().int().min(1),
});
export type ListVideosOutput = z.infer<typeof listVideosOutputSchema>;
