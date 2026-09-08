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
  // Fullscreen targets this container rather than the <video>: nothing can be
  // painted over a fullscreen video element, so the overlay needs a host.
  "&:fullscreen": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
  },
  "&:fullscreen video": {
    maxHeight: "100%",
  },
  // The built-in button fullscreens the <video>, defeating the above; the
  // overlay carries our own.
  "& video::-webkit-media-controls-fullscreen-button": {
    display: "none",
  },
  // Reveal the overlay like the cards' play badge: on hover, or whenever a
  // control has focus. Touch devices have no hover, so it stays visible.
  "& .overlay": {
    opacity: 0,
    transition: theme.transitions.create("opacity"),
  },
  "&:hover .overlay, &:focus-within .overlay": {
    opacity: 1,
  },
  "@media (hover: none)": {
    "& .overlay": { opacity: 1 },
  },
  "& .overlay button": {
    color: theme.palette.common.white,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.7)" },
    "&.Mui-disabled": { color: "rgba(255, 255, 255, 0.3)" },
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

/**
 * Hover-revealed controls painted over the picture: skip arrows at the
 * vertical centre, fullscreen toggle clear of the native control bar.
 */
export const Overlay = styled("div")(({ theme }) => ({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  "& button": {
    position: "absolute",
    pointerEvents: "auto",
  },
  "& .skip": {
    top: "50%",
    transform: "translateY(-50%)",
  },
  "& .prev": { left: theme.spacing(2) },
  "& .next": { right: theme.spacing(2) },
  "& .fullscreen": {
    right: theme.spacing(2),
    // above the browser's own control bar
    bottom: theme.spacing(7),
  },
}));
