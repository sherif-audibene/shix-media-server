"use client";

import { useState } from "react";
import { useFormatter } from "next-intl";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import PlayCircleIcon from "@mui/icons-material/PlayCircleOutline";
import MovieIcon from "@mui/icons-material/Movie";
import type { VideoFile } from "@/schemas/video";
import { Link } from "@/i18n/navigation";
import { formatBytes, videoThumbnailUrl, watchHref } from "@/lib/video";
import {
  CardClickArea,
  PlayBadge,
  Thumb,
} from "@/components/VideoCard/VideoCard.styled";

export interface VideoCardProps {
  folderId: string;
  video: VideoFile;
}

/**
 * A YouTube-style thumbnail card. Uses the ffmpeg-generated poster image and
 * links to the dedicated /watch page.
 */
export function VideoCard({ folderId, video }: VideoCardProps) {
  const format = useFormatter();
  const [failed, setFailed] = useState(false);
  const subdir = video.relPath.includes("/")
    ? video.relPath.slice(0, video.relPath.lastIndexOf("/"))
    : null;

  return (
    <Card variant="outlined">
      <Link href={watchHref(folderId, video.id)}>
        <CardClickArea>
          <Thumb>
            {failed ? (
              <MovieIcon sx={{ fontSize: 56, color: "grey.600" }} />
            ) : (
              <img
                src={videoThumbnailUrl(folderId, video.id)}
                alt={video.name}
                loading="lazy"
                onError={() => setFailed(true)}
              />
            )}
            <PlayBadge className="play-badge">
              <PlayCircleIcon sx={{ fontSize: 56 }} />
            </PlayBadge>
          </Thumb>
          <CardContent>
            <Typography
              variant="subtitle2"
              title={video.name}
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {video.name}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              sx={{ mt: 0.5 }}
            >
              <Typography variant="caption" color="text.secondary" noWrap>
                {subdir ?? video.ext.replace(".", "").toUpperCase()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatBytes(video.size)}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {format.dateTime(video.modifiedAt, { dateStyle: "medium" })}
            </Typography>
          </CardContent>
        </CardClickArea>
      </Link>
    </Card>
  );
}
