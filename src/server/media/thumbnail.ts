import "server-only";

import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import ffmpegStatic from "ffmpeg-static";

const CACHE_DIR = path.join(os.tmpdir(), "next-trpc-grid-thumbs");
const THUMB_WIDTH = 480;
const SEEK_SECONDS = "3";

/**
 * Resolve the ffmpeg binary: an explicit FFMPEG_PATH (set in production to the
 * system ffmpeg) wins, then the bundled ffmpeg-static (local dev), then a bare
 * "ffmpeg" found on PATH.
 */
const FFMPEG_BIN = process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";

/** Decode a single JPEG frame from the video via ffmpeg, to stdout. */
function runFfmpeg(absPath: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    if (!FFMPEG_BIN) {
      resolve(null);
      return;
    }
    const args = [
      "-ss",
      SEEK_SECONDS,
      "-i",
      absPath,
      "-frames:v",
      "1",
      "-vf",
      `scale=${THUMB_WIDTH}:-2`,
      "-c:v",
      "mjpeg",
      "-f",
      "image2",
      "pipe:1",
    ];
    const proc = spawn(FFMPEG_BIN, args, {
      stdio: ["ignore", "pipe", "ignore"],
    });
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.on("error", () => resolve(null));
    proc.on("close", (code) => {
      resolve(code === 0 && chunks.length > 0 ? Buffer.concat(chunks) : null);
    });
  });
}

/**
 * Returns a JPEG thumbnail for the given video, generating it with ffmpeg on
 * first request and caching it on disk (keyed by path + mtime + size so it
 * invalidates when the file changes). Returns null if ffmpeg is unavailable
 * or decoding fails.
 */
export async function getThumbnail(
  absPath: string,
  mtimeMs: number,
  size: number,
): Promise<Buffer | null> {
  const key = createHash("sha1")
    .update(`${absPath}:${mtimeMs}:${size}`)
    .digest("hex");
  const cacheFile = path.join(CACHE_DIR, `${key}.jpg`);

  try {
    return await fs.readFile(cacheFile);
  } catch {
    // not cached yet — fall through to generate
  }

  const buffer = await runFfmpeg(absPath);
  if (!buffer) return null;

  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cacheFile, buffer);
  } catch {
    // caching is best-effort; still return the freshly generated frame
  }
  return buffer;
}
