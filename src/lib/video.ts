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

/** Locale-relative path to the dedicated watch page for a video. */
export function watchHref(folderId: string, videoId: string): string {
  return `/watch/${folderId}/${videoId}`;
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
