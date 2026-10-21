import "server-only";

import path from "node:path";
import { promises as fs } from "node:fs";

export interface FavoriteRef {
  folderId: string;
  videoId: string;
}

/**
 * Favourites live in a JSON file next to the app (single-user auth, no DB).
 * ponytail: whole-file rewrite per change; fine for hundreds of entries.
 */
const FILE = path.join(process.cwd(), ".data", "favorites.json");

export async function readFavorites(): Promise<FavoriteRef[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as FavoriteRef[];
  } catch {
    return []; // missing / unreadable file = no favourites yet
  }
}

async function writeFavorites(list: FavoriteRef[]): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  // Write-then-rename so a crash never leaves a half-written file.
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(list, null, 2));
  await fs.rename(tmp, FILE);
}

const same = (a: FavoriteRef, b: FavoriteRef) =>
  a.folderId === b.folderId && a.videoId === b.videoId;

export async function isFavorite(ref: FavoriteRef): Promise<boolean> {
  return (await readFavorites()).some((f) => same(f, ref));
}

/** Add or remove a favourite; returns the new state. */
export async function setFavorite(
  ref: FavoriteRef,
  favorite: boolean,
): Promise<boolean> {
  const rest = (await readFavorites()).filter((f) => !same(f, ref));
  await writeFavorites(favorite ? [...rest, ref] : rest);
  return favorite;
}
