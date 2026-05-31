import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import type { SortingState } from "@tanstack/react-table";
import { UserTable } from "@/components/UserTable/UserTable";
import type { ListUsersOutput, User } from "@/schemas/user";

const sampleRows: User[] = [
  {
    id: "00000001-0000-4000-8000-000000000000",
    name: "Alex Schmidt",
    email: "alex.schmidt@example.com",
    role: "admin",
    active: true,
    createdAt: new Date("2024-02-11"),
  },
  {
    id: "00000002-0000-4000-8000-000000000000",
    name: "Maria Rossi",
    email: "maria.rossi@example.com",
    role: "editor",
    active: false,
    createdAt: new Date("2024-05-03"),
  },
  {
    id: "00000003-0000-4000-8000-000000000000",
    name: "Kenji Tanaka",
    email: "kenji.tanaka@example.com",
    role: "viewer",
    active: true,
    createdAt: new Date("2024-08-21"),
  },
];

const data: ListUsersOutput = {
  rows: sampleRows,
  total: sampleRows.length,
  page: 0,
  pageSize: 10,
};

/** Interactive wrapper so the controlled table is usable in the canvas. */
function Harness({
  rows = data,
  isLoading = false,
}: {
  rows?: ListUsersOutput;
  isLoading?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  return (
    <UserTable
      data={rows}
      isLoading={isLoading}
      sorting={sorting}
      onSortingChange={setSorting}
      search={search}
      onSearchChange={setSearch}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    />
  );
}

const meta = {
  title: "Components/UserTable",
  component: UserTable,
  parameters: { layout: "padded" },
  // Default args satisfy the required props; stories override via `render`.
  args: {
    data,
    sorting: [{ id: "name", desc: false }],
    onSortingChange: () => {},
    search: "",
    onSearchChange: () => {},
    page: 0,
    pageSize: 10,
    onPageChange: () => {},
    onPageSizeChange: () => {},
  },
} satisfies Meta<typeof UserTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Harness />,
};

export const Loading: Story = {
  render: () => <Harness isLoading rows={{ ...data, rows: [] }} />,
};

export const Empty: Story = {
  render: () => <Harness rows={{ rows: [], total: 0, page: 0, pageSize: 10 }} />,
};
