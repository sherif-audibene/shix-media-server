"use client";

import { useMemo, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { api } from "@/trpc/react";
import type { ListUsersInput, ListUsersOutput } from "@/schemas/user";
import { UserTable } from "@/components/UserTable/UserTable";

const EMPTY: ListUsersOutput = { rows: [], total: 0, page: 0, pageSize: 10 };

/**
 * Connects the presentational UserTable to the tRPC `user.list` query,
 * translating TanStack's SortingState to the router's sort input.
 */
export function UserTableContainer() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);

  const input = useMemo<ListUsersInput>(() => {
    const sort = sorting[0];
    return {
      search: search || undefined,
      page,
      pageSize,
      sortBy: (sort?.id as ListUsersInput["sortBy"]) ?? "name",
      sortDir: sort?.desc ? "desc" : "asc",
    };
  }, [search, page, pageSize, sorting]);

  const query = api.user.list.useQuery(input, {
    placeholderData: keepPreviousData,
  });

  return (
    <UserTable
      data={query.data ?? EMPTY}
      isLoading={query.isPending || query.isPlaceholderData}
      sorting={sorting}
      onSortingChange={(updater) => {
        setSorting(updater);
        setPage(0);
      }}
      search={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(0);
      }}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(0);
      }}
    />
  );
}
