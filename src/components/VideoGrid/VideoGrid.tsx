"use client";

import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import type { VideoFile } from "@/schemas/video";
import { VideoCard } from "@/components/VideoCard/VideoCard";
import { Grid } from "@/components/VideoGrid/VideoGrid.styled";

export interface VideoGridProps {
  folderId: string;
  videos: VideoFile[];
}

/** Presentational grid of video thumbnails linking to the watch page. */
export function VideoGrid({ folderId, videos }: VideoGridProps) {
  const t = useTranslations("Videos");

  if (videos.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <VideocamOffIcon sx={{ fontSize: 48, mb: 1 }} />
        <Typography>{t("empty")}</Typography>
      </Box>
    );
  }

  return (
    <Grid>
      {videos.map((video) => (
        <VideoCard key={video.id} folderId={folderId} video={video} />
      ))}
    </Grid>
  );
}
