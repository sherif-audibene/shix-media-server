"use client";

import { styled } from "@mui/material/styles";

/** 16:9 thumbnail frame holding the preview <video> / fallback. */
export const Thumb = styled("div")(({ theme }) => ({
  position: "relative",
  width: "100%",
  aspectRatio: "16 / 9",
  backgroundColor: theme.palette.common.black,
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "& video, & img": {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
}));

/** Translucent play badge centered over the thumbnail. */
export const PlayBadge = styled("div")(({ theme }) => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.common.white,
  background:
    "linear-gradient(transparent 55%, rgba(0,0,0,0.55))",
  opacity: 0,
  transition: theme.transitions.create("opacity"),
}));

export const CardClickArea = styled("div")({
  display: "block",
  cursor: "pointer",
  ":hover .play-badge": { opacity: 1 },
});
