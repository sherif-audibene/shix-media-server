"use client";

import { useMemo } from "react";
import { useTranslations, useFormatter } from "next-intl";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import type { ListUsersOutput, User } from "@/schemas/user";
import {
  SortableHeaderCell,
  TableSurface,
  Toolbar,
} from "@/components/UserTable/UserTable.styled";

export interface UserTableProps {
  data: ListUsersOutput;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

/**
 * Presentational, data-source-agnostic users grid. All state is controlled
 * by the parent so it can be driven by tRPC in the app and by fixtures in
 * Storybook.
 */
export function UserTable({
  data,
  sorting,
  onSortingChange,
  search,
  onSearchChange,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: UserTableProps) {
  const t = useTranslations("Users");
  const format = useFormatter();

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      { accessorKey: "name", header: () => t("columns.name") },
      { accessorKey: "email", header: () => t("columns.email") },
      {
        accessorKey: "role",
        header: () => t("columns.role"),
        cell: ({ getValue }) => (
          <Chip
            size="small"
            label={t(`roles.${getValue<User["role"]>()}`)}
            variant="outlined"
          />
        ),
      },
      {
        accessorKey: "active",
        header: () => t("columns.active"),
        cell: ({ getValue }) =>
          getValue<boolean>() ? t("active.yes") : t("active.no"),
      },
      {
        accessorKey: "createdAt",
        header: () => t("columns.createdAt"),
        cell: ({ getValue }) =>
          format.dateTime(getValue<Date>(), { dateStyle: "medium" }),
      },
    ],
    [t, format],
  );

  const table = useReactTable({
    data: data.rows,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TableSurface elevation={0}>
      <Toolbar>
        <TextField
          size="small"
          label={t("search")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: 260 }}
        />
      </Toolbar>

      {isLoading ? <LinearProgress /> : <div style={{ height: 4 }} />}

      <TableContainer>
        <Table size="small" aria-label={t("title")}>
          <TableHead>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  return (
                    <SortableHeaderCell
                      key={header.id}
                      sortable={canSort}
                      onClick={header.column.getToggleSortingHandler()}
                      sortDirection={dir === false ? false : dir}
                    >
                      <TableSortLabel
                        active={dir !== false}
                        direction={dir === false ? "asc" : dir}
                        hideSortIcon={!canSort}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableSortLabel>
                    </SortableHeaderCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  {isLoading ? t("loading") : t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} hover>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={data.total}
        page={page}
        rowsPerPage={pageSize}
        labelRowsPerPage={t("rowsPerPage")}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_, next) => onPageChange(next)}
        onRowsPerPageChange={(e) =>
          onPageSizeChange(Number(e.target.value))
        }
      />
    </TableSurface>
  );
}
