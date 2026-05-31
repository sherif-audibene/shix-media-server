"use client";

import { styled } from "@mui/material/styles";

/** Responsive auto-fill grid of video cards (YouTube-like). */
export const Grid = styled("div")(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(2),
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
}));
