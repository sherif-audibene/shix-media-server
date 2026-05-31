"use client";

import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import TableCell from "@mui/material/TableCell";

/** Outer card wrapping the grid + toolbar. */
export const TableSurface = styled(Paper)(({ theme }) => ({
  width: "100%",
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

/** Sortable header cell — pointer + no text selection on click. */
export const SortableHeaderCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== "sortable",
})<{ sortable?: boolean }>(({ theme, sortable }) => ({
  fontWeight: 600,
  whiteSpace: "nowrap",
  userSelect: "none",
  cursor: sortable ? "pointer" : "default",
  backgroundColor: theme.palette.background.default,
  "&:hover": sortable
    ? { color: theme.palette.primary.main }
    : undefined,
}));

/** Flex container for the search + filter toolbar above the grid. */
export const Toolbar = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  flexWrap: "wrap",
}));
