import type { User, UserRole } from "@/schemas/user";

const roles: UserRole[] = ["admin", "editor", "viewer"];
const firstNames = [
  "Alex",
  "Maria",
  "Kenji",
  "Sofia",
  "Liam",
  "Noor",
  "Elena",
  "Tom",
  "Yuki",
  "Pablo",
];
const lastNames = [
  "Schmidt",
  "Rossi",
  "Tanaka",
  "Garcia",
  "Dubois",
  "Novak",
  "Khan",
  "Smith",
  "Müller",
  "Costa",
];

/** Deterministic UUID-ish id so the dataset is stable across restarts. */
function pseudoUuid(n: number): string {
  const hex = (n * 2654435761).toString(16).padStart(8, "0").slice(-8);
  return `${hex}-0000-4000-8000-${hex}00000000`.slice(0, 36);
}

/** In-memory seed dataset standing in for a database. */
export const users: User[] = Array.from({ length: 137 }, (_, i) => {
  const first = firstNames[i % firstNames.length]!;
  const last = lastNames[(i * 7) % lastNames.length]!;
  return {
    id: pseudoUuid(i + 1),
    name: `${first} ${last}`,
    email: `${first}.${last}.${i}@example.com`.toLowerCase(),
    role: roles[i % roles.length]!,
    active: i % 4 !== 0,
    createdAt: new Date(2024, 0, 1 + (i % 365)),
  };
});
