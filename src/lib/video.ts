import type { VideoFile } from "@/schemas/video";

/** Build the streaming URL for a video (safe to import on the client). */
export function videoStreamUrl(folderId: string, videoId: string): string {
  const params = new URLSearchParams({ f: folderId, v: videoId });
  return `/api/stream?${params.toString()}`;
}

/** Build the ffmpeg-thumbnail URL for a video. */
export function videoThumbnailUrl(folderId: string, videoId: string): string {
  const params = new URLSearchParams({ f: folderId, v: videoId });
  return `/api/thumbnail?${params.toString()}`;
}

/** Playback queue a watch page was opened from (default: the video's folder). */
export type WatchList = "favorites";

/** A video plus the folder it lives in (queues can span folders). */
export interface WatchItem {
  folderId: string;
  video: VideoFile;
}

/** Locale-relative path to the dedicated watch page for a video. */
export function watchHref(
  folderId: string,
  videoId: string,
  list?: WatchList,
): string {
  const href = `/watch/${folderId}/${videoId}`;
  return list ? `${href}?list=${list}` : href;
}

/** Human-readable file size. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Locale-relative path to a folder, optionally deep-linked to a sub-folder. */
export function folderHref(folderId: string, subPath = ""): string {
  const base = `/folders/${folderId}`;
  return subPath ? `${base}?path=${encodeURIComponent(subPath)}` : base;
}

/** Immediate parent of a folder-relative path ("" = root, null above root). */
export function parentPath(path: string): string | null {
  if (path === "") return null;
  const slash = path.lastIndexOf("/");
  return slash === -1 ? "" : path.slice(0, slash);
}

/** Previous / next sibling of a sub-folder (same parent, sorted by name). */
export function folderSiblings<T extends { path: string; name: string }>(
  tree: T[],
  path: string,
): [T | undefined, T | undefined] {
  if (path === "") return [undefined, undefined];
  const parent = parentPath(path);
  const siblings = tree
    .filter((node) => parentPath(node.path) === parent)
    .sort((a, b) => a.name.localeCompare(b.name));
  const i = siblings.findIndex((node) => node.path === path);
  if (i === -1) return [undefined, undefined];
  return [siblings[i - 1], siblings[i + 1]];
}
