import { z } from "zod";

/** Canonical user role enum, reused across routers and UI. */
export const userRoleSchema = z.enum(["admin", "editor", "viewer"]);
export type UserRole = z.infer<typeof userRoleSchema>;

/** Domain model for a user record. */
export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  email: z.email(),
  role: userRoleSchema,
  active: z.boolean(),
  createdAt: z.date(),
});
export type User = z.infer<typeof userSchema>;

/** Input for the paginated/sorted list query (drives the table). */
export const listUsersInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: userRoleSchema.optional(),
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["name", "email", "role", "createdAt"]).default("name"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});
export type ListUsersInput = z.infer<typeof listUsersInputSchema>;

/** Response shape for the list query. */
export const listUsersOutputSchema = z.object({
  rows: z.array(userSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(0),
  pageSize: z.number().int().min(1),
});
export type ListUsersOutput = z.infer<typeof listUsersOutputSchema>;

/** Input for creating a user. */
export const createUserInputSchema = userSchema
  .pick({ name: true, email: true, role: true })
  .extend({ active: z.boolean().default(true) });
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
