"use client";

import { useMemo, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MovieIcon from "@mui/icons-material/Movie";
import type { VideoFile } from "@/schemas/video";
import { Link, useRouter } from "@/i18n/navigation";
import {
  formatBytes,
  videoStreamUrl,
  videoThumbnailUrl,
  watchHref,
} from "@/lib/video";
import {
  Layout,
  PlayerSurface,
  UpNextItem,
} from "@/components/WatchView/WatchView.styled";

export interface WatchViewProps {
  folderId: string;
  current: VideoFile;
  videos: VideoFile[];
}

/** Thumbnail for the up-next rail, falling back to an icon on error. */
function RailThumb({
  folderId,
  video,
}: {
  folderId: string;
  video: VideoFile;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <Stack className="thumb" alignItems="center" justifyContent="center">
        <MovieIcon sx={{ color: "grey.600" }} />
      </Stack>
    );
  }
  return (
    <div className="thumb">
      <img
        src={videoThumbnailUrl(folderId, video.id)}
        alt={video.name}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

/** Dedicated watch page body: large player + "more in this folder" rail. */
export function WatchView({ folderId, current, videos }: WatchViewProps) {
  const t = useTranslations("Watch");
  const format = useFormatter();
  const router = useRouter();

  // Rail order: by name (locale-aware), so "up next" follows what's listed.
  const others = useMemo(
    () => [...videos].sort((a, b) => a.name.localeCompare(b.name)),
    [videos],
  );

  // The next video in the sub-folder, played automatically when this one ends.
  const next = useMemo(() => {
    const index = others.findIndex((v) => v.id === current.id);
    return index >= 0 ? others[index + 1] : undefined;
  }, [others, current.id]);

  return (
    <Layout>
      <Stack spacing={2}>
        <PlayerSurface>
          <video
            key={current.id}
            controls
            autoPlay
            playsInline
            preload="metadata"
            onEnded={() => {
              if (next) router.push(watchHref(folderId, next.id));
            }}
          >
            <source
              src={videoStreamUrl(folderId, current.id)}
              type={current.mimeType}
            />
          </video>
        </PlayerSurface>
        <div>
          <Typography variant="h5" fontWeight={700}>
            {current.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatBytes(current.size)} ·{" "}
            {format.dateTime(current.modifiedAt, { dateStyle: "medium" })}
            {current.relPath.includes("/")
              ? ` · ${current.relPath.slice(0, current.relPath.lastIndexOf("/"))}`
              : ""}
          </Typography>
        </div>
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          {t("upNext")}
        </Typography>
        {others.map((video) => {
          const active = video.id === current.id;
          return (
            <Link key={video.id} href={watchHref(folderId, video.id)}>
              <UpNextItem data-active={active}>
                <RailThumb folderId={folderId} video={video} />
                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={active ? 700 : 500}
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
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(video.size)}
                  </Typography>
                </Stack>
              </UpNextItem>
            </Link>
          );
        })}
      </Stack>
    </Layout>
  );
}
