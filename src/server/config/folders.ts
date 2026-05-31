import "server-only";

import path from "node:path";
import { promises as fs, type Dirent } from "node:fs";
import { env } from "@/lib/env";
import type { VideoFile, VideoFolderNode } from "@/schemas/video";

export interface VideoFolderConfig {
  id: string;
  label: string;
  /** Absolute, resolved filesystem path. Never sent to the client. */
  path: string;
}

/** Supported video extensions mapped to the MIME type used when streaming. */
export const VIDEO_MIME: Readonly<Record<string, string>> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".ogg": "video/ogg",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
};

const MAX_DEPTH = 4;

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "folder"
  );
}

let cache: VideoFolderConfig[] | null = null;

/** Parse `VIDEO_FOLDERS` into a deduplicated, id-stable folder list. */
export function getFolders(): VideoFolderConfig[] {
  if (cache) return cache;

  const raw = env.VIDEO_FOLDERS ?? "";
  const seen = new Set<string>();
  const folders: VideoFolderConfig[] = [];

  for (const entry of raw.split(";").map((s) => s.trim()).filter(Boolean)) {
    const sep = entry.indexOf("|");
    const rawLabel = sep === -1 ? "" : entry.slice(0, sep).trim();
    const rawPath = (sep === -1 ? entry : entry.slice(sep + 1)).trim();
    if (!rawPath) continue;

    const abs = path.resolve(rawPath);
    const label = rawLabel || path.basename(abs);

    let id = slugify(label);
    const base = id;
    let n = 1;
    while (seen.has(id)) id = `${base}-${n++}`;
    seen.add(id);

    folders.push({ id, label, path: abs });
  }

  cache = folders;
  return folders;
}

export function getFolder(id: string): VideoFolderConfig | null {
  return getFolders().find((f) => f.id === id) ?? null;
}

/**
 * The sub-directory a folder-relative path lives in, normalized to "/"
 * separators. Returns "" for files directly in the folder root.
 */
export function videoSubPath(relPath: string): string {
  const dir = path.dirname(relPath);
  if (dir === "." || dir === path.sep) return "";
  return dir.split(path.sep).join("/");
}

/** Encode/decode a folder-relative path as a URL-safe id. */
export function encodeVideoId(relPath: string): string {
  return Buffer.from(relPath, "utf8").toString("base64url");
}
export function decodeVideoId(id: string): string {
  return Buffer.from(id, "base64url").toString("utf8");
}

/**
 * Resolve a folder-relative video id to an absolute path, guaranteeing the
 * result stays inside the folder root and has a supported extension.
 * Returns null on traversal attempts or unsupported files.
 */
export function resolveVideoPath(
  folder: VideoFolderConfig,
  videoId: string,
): { absPath: string; mimeType: string } | null {
  let relPath: string;
  try {
    relPath = decodeVideoId(videoId);
  } catch {
    return null;
  }

  const absPath = path.resolve(folder.path, relPath);
  const root = folder.path + path.sep;
  if (absPath !== folder.path && !absPath.startsWith(root)) return null;

  const mimeType = VIDEO_MIME[path.extname(absPath).toLowerCase()];
  if (!mimeType) return null;

  return { absPath, mimeType };
}

/** Resolve a single video's metadata by id (independent of pagination). */
export async function getVideoFile(
  folder: VideoFolderConfig,
  videoId: string,
): Promise<VideoFile | null> {
  const resolved = resolveVideoPath(folder, videoId);
  if (!resolved) return null;
  try {
    const stat = await fs.stat(resolved.absPath);
    const relPath = decodeVideoId(videoId);
    const name = path.basename(relPath);
    return {
      id: videoId,
      name,
      relPath,
      ext: path.extname(name).toLowerCase(),
      mimeType: resolved.mimeType,
      size: stat.size,
      modifiedAt: stat.mtime,
    };
  } catch {
    return null;
  }
}

/** Recursively scan a folder for supported video files (uncached). */
async function scanVideos(folder: VideoFolderConfig): Promise<VideoFile[]> {
  const results: VideoFile[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    if (depth > MAX_DEPTH) return;
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // unreadable / missing dir — skip gracefully
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(full, depth + 1);
        continue;
      }
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      const mimeType = VIDEO_MIME[ext];
      if (!mimeType) continue;

      const stat = await fs.stat(full);
      const relPath = path.relative(folder.path, full);
      results.push({
        id: encodeVideoId(relPath),
        name: entry.name,
        relPath,
        ext,
        mimeType,
        size: stat.size,
        modifiedAt: stat.mtime,
      });
    }
  }

  await walk(folder.path, 0);
  results.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return results;
}

/** How long a folder scan stays fresh before being re-read from disk. */
const SCAN_TTL_MS = 30_000;

interface ScanCacheEntry {
  at: number;
  videos: VideoFile[];
}

const scanCache = new Map<string, ScanCacheEntry>();
const inflightScans = new Map<string, Promise<VideoFile[]>>();

/**
 * Returns a folder's video list, served from an in-memory cache that expires
 * after SCAN_TTL_MS. Concurrent misses share a single scan (no thundering
 * herd). Keeps paging snappy for large folders without going stale for long.
 */
export async function listVideos(
  folder: VideoFolderConfig,
): Promise<VideoFile[]> {
  const cached = scanCache.get(folder.id);
  if (cached && Date.now() - cached.at < SCAN_TTL_MS) {
    return cached.videos;
  }

  const pending = inflightScans.get(folder.id);
  if (pending) return pending;

  const scan = scanVideos(folder)
    .then((videos) => {
      scanCache.set(folder.id, { at: Date.now(), videos });
      return videos;
    })
    .finally(() => {
      inflightScans.delete(folder.id);
    });

  inflightScans.set(folder.id, scan);
  return scan;
}

/**
 * The folder's full directory tree as a flat, path-sorted node list. Includes
 * the root ("") and every intermediate directory — even ones that hold only
 * sub-folders — so the client can drill down level by level. Each node carries
 * its direct video count and its recursive (subtree) total.
 */
export async function listFolderTree(
  folder: VideoFolderConfig,
): Promise<VideoFolderNode[]> {
  const all = await listVideos(folder);

  const direct = new Map<string, number>();
  const dirs = new Set<string>([""]); // root always exists

  for (const video of all) {
    const dir = videoSubPath(video.relPath);
    direct.set(dir, (direct.get(dir) ?? 0) + 1);
    // Register every ancestor directory up to the root.
    for (let p = dir; p !== ""; ) {
      dirs.add(p);
      const slash = p.lastIndexOf("/");
      p = slash === -1 ? "" : p.slice(0, slash);
    }
  }

  return [...dirs]
    .map((path) => {
      let totalCount = 0;
      for (const [dir, count] of direct) {
        if (path === "" || dir === path || dir.startsWith(`${path}/`)) {
          totalCount += count;
        }
      }
      return {
        path,
        name: path === "" ? "" : path.slice(path.lastIndexOf("/") + 1),
        videoCount: direct.get(path) ?? 0,
        totalCount,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Drop cached scans (a specific folder, or all). */
export function invalidateVideoScan(folderId?: string): void {
  if (folderId) scanCache.delete(folderId);
  else scanCache.clear();
}
