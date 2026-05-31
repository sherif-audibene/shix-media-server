import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "@/server/trpc";
import { users } from "@/server/data/users";
import {
  createUserInputSchema,
  listUsersInputSchema,
  listUsersOutputSchema,
  userSchema,
  type User,
} from "@/schemas/user";

function compare(a: User, b: User, key: keyof User): number {
  const av = a[key];
  const bv = b[key];
  if (av instanceof Date && bv instanceof Date) {
    return av.getTime() - bv.getTime();
  }
  return String(av).localeCompare(String(bv));
}

export const userRouter = router({
  /** Paginated, filterable, sortable list — backs the TanStack table. */
  list: publicProcedure
    .input(listUsersInputSchema)
    .output(listUsersOutputSchema)
    .query(({ input }) => {
      const term = input.search?.toLowerCase();
      let rows = users.filter((u) => {
        if (input.role && u.role !== input.role) return false;
        if (term) {
          return (
            u.name.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term)
          );
        }
        return true;
      });

      rows = [...rows].sort((a, b) => {
        const c = compare(a, b, input.sortBy);
        return input.sortDir === "asc" ? c : -c;
      });

      const total = rows.length;
      const start = input.page * input.pageSize;
      const paged = rows.slice(start, start + input.pageSize);

      return {
        rows: paged,
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /** Fetch a single user by id. */
  byId: publicProcedure
    .input(z.object({ id: z.uuid() }))
    .output(userSchema)
    .query(({ input }) => {
      const found = users.find((u) => u.id === input.id);
      if (!found) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      return found;
    }),

  /** Create a user (protected — requires an authenticated session). */
  create: protectedProcedure
    .input(createUserInputSchema)
    .output(userSchema)
    .mutation(({ input }) => {
      const created: User = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        ...input,
      };
      users.unshift(created);
      return created;
    }),
});
