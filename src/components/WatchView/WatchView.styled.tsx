"use client";

import { styled } from "@mui/material/styles";

/** Two-column watch layout: player + "up next" rail, stacking on mobile. */
export const Layout = styled("div")(({ theme }) => ({
  display: "grid",
  gap: theme.spacing(3),
  gridTemplateColumns: "1fr",
  [theme.breakpoints.up("md")]: {
    gridTemplateColumns: "minmax(0, 1fr) 340px",
  },
}));

export const PlayerSurface = styled("div")(({ theme }) => ({
  position: "relative",
  width: "100%",
  backgroundColor: theme.palette.common.black,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  "& video": {
    display: "block",
    width: "100%",
    maxHeight: "78vh",
  },
}));

/** A single "up next" row: thumbnail + title. */
export const UpNextItem = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "160px 1fr",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create("background-color"),
  "&[data-active='true']": {
    backgroundColor: theme.palette.action.selected,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  "& .thumb": {
    position: "relative",
    // padding-top hack instead of aspect-ratio: needs iOS 15+, older
    // Safari collapses the box to 0 height
    paddingTop: "56.25%",
    backgroundColor: theme.palette.common.black,
    borderRadius: theme.shape.borderRadius,
    overflow: "hidden",
  },
  "& .thumb img, & .thumb svg": {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "block",
  },
  "& .thumb img": {
    objectFit: "cover",
  },
  "& .thumb svg": {
    padding: "35%",
  },
}));
