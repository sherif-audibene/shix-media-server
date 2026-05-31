import { promises as fs, createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { getFolder, resolveVideoPath } from "@/server/config/folders";

// Filesystem streaming requires the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a configured video file, honoring HTTP Range requests so the
 * browser can seek. Query params: `f` = folder id, `v` = video id.
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

  const { absPath, mimeType } = resolved;

  let size: number;
  try {
    size = (await fs.stat(absPath)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const range = req.headers.get("range");

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    let start = match?.[1] ? Number.parseInt(match[1], 10) : 0;
    let end = match?.[2] ? Number.parseInt(match[2], 10) : size - 1;
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end)) end = size - 1;
    end = Math.min(end, size - 1);

    if (start > end || start >= size) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }

    const nodeStream = createReadStream(absPath, { start, end });
    return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  }

  const nodeStream = createReadStream(absPath);
  return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
    status: 200,
    headers: {
      "Content-Type": mimeType,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}
