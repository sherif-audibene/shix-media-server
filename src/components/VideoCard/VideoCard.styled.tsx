"use client";

import { styled } from "@mui/material/styles";

/** 16:9 thumbnail frame holding the preview <video> / fallback. */
export const Thumb = styled("div")(({ theme }) => ({
  position: "relative",
  width: "100%",
  // padding-top hack instead of aspect-ratio: needs iOS 15+, older
  // Safari collapses the box to 0 height (cards render as bare lines)
  paddingTop: "56.25%",
  backgroundColor: theme.palette.common.black,
  overflow: "hidden",
  "& video, & img": {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  "& > svg": {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
}));

/** Translucent play badge centered over the thumbnail. */
export const PlayBadge = styled("div")(({ theme }) => ({
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
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
