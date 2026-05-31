import { promises as fs } from "node:fs";
import { getFolder, resolveVideoPath } from "@/server/config/folders";
import { getThumbnail } from "@/server/media/thumbnail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns a JPEG poster frame for a video. Query: `f` = folder id,
 * `v` = video id. Generated with ffmpeg and cached on disk.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const folderId = url.searchParams.get("f");
  const videoId = url.searchParams.get("v");
  if (!folderId || !videoId) {
    return new Response("Missing folder or video id", { status: 400 });
  }

  const folder = getFolder(folderId);
  if (!folder) return new Response("Unknown folder", { status: 404 });

  const resolved = resolveVideoPath(folder, videoId);
  if (!resolved) return new Response("Forbidden", { status: 403 });

  let mtimeMs: number;
  let size: number;
  try {
    const stat = await fs.stat(resolved.absPath);
    mtimeMs = stat.mtimeMs;
    size = stat.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const thumb = await getThumbnail(resolved.absPath, mtimeMs, size);
  if (!thumb) return new Response("No thumbnail", { status: 404 });

  return new Response(new Uint8Array(thumb), {
    status: 200,
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
