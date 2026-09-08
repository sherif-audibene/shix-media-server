"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import MovieIcon from "@mui/icons-material/Movie";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
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

/** localStorage key for the cinema-mode preference. */
const CINEMA_KEY = "shix:cinema";

/** iOS Safari has no Element.requestFullscreen; it flags the video instead. */
type MaybeIosVideo = HTMLVideoElement & {
  webkitDisplayingFullscreen?: boolean;
};

/** True while a video is showing fullscreen, including iOS's native player. */
function isFullscreen(video: HTMLVideoElement | null): boolean {
  return Boolean(
    document.fullscreenElement ||
    (video as MaybeIosVideo | null)?.webkitDisplayingFullscreen,
  );
}

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
  const videoRef = useRef<HTMLVideoElement>(null);

  // What the player shows: normally the server-rendered video, but cinema
  // mode swaps it in place (no route change) to keep fullscreen alive.
  const [playing, setPlaying] = useState(current);
  const [cinema, setCinema] = useState(false);

  // localStorage exists only on the client, so read the flag after mount.
  useEffect(() => setCinema(localStorage.getItem(CINEMA_KEY) === "1"), []);

  // A real navigation (rail click, direct link, back button) always wins.
  useEffect(() => setPlaying(current), [current]);

  // Same element, new source: reload and keep going. Remounting the <video>
  // — which a route change does — would drop the fullscreen session.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.load();
    void el.play().catch(() => {});
  }, [playing.id]);

  // Rail order: by name (locale-aware), so "up next" follows what's listed.
  const others = useMemo(
    () => [...videos].sort((a, b) => a.name.localeCompare(b.name)),
    [videos],
  );

  // Neighbours in the rail order: previous, and the next one — which also
  // plays automatically when this video ends.
  const [previous, next] = useMemo(() => {
    const index = others.findIndex((v) => v.id === playing.id);
    return index < 0
      ? [undefined, undefined]
      : [others[index - 1], others[index + 1]];
  }, [others, playing.id]);

  /** Move to another video: in place while fullscreen, else a page change. */
  const go = useCallback(
    (video: VideoFile | undefined) => {
      if (!video) return;
      if (cinema && isFullscreen(videoRef.current)) setPlaying(video);
      else router.push(watchHref(folderId, video.id));
    },
    [cinema, folderId, router],
  );

  // In-place swaps leave the URL pointing at the video we started from; put
  // it back in sync as soon as the user leaves fullscreen.
  useEffect(() => {
    if (playing.id === current.id) return;
    const el = videoRef.current;
    const sync = () => {
      if (!isFullscreen(el)) router.replace(watchHref(folderId, playing.id));
    };
    document.addEventListener("fullscreenchange", sync);
    el?.addEventListener("webkitendfullscreen", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      el?.removeEventListener("webkitendfullscreen", sync);
    };
  }, [playing.id, current.id, folderId, router]);

  return (
    <Layout>
      <Stack spacing={2}>
        <PlayerSurface>
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            preload="metadata"
            onEnded={() => go(next)}
          >
            <source
              src={videoStreamUrl(folderId, playing.id)}
              type={playing.mimeType}
            />
          </video>
        </PlayerSurface>
        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button
            disabled={!previous}
            startIcon={<SkipPreviousIcon />}
            color="inherit"
            title={previous?.name}
            onClick={() => go(previous)}
          >
            {t("previous")}
          </Button>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={cinema}
                onChange={(e) => {
                  setCinema(e.target.checked);
                  localStorage.setItem(
                    CINEMA_KEY,
                    e.target.checked ? "1" : "0",
                  );
                }}
              />
            }
            label={t("cinema")}
            title={t("cinemaHint")}
          />
          <Button
            disabled={!next}
            endIcon={<SkipNextIcon />}
            color="inherit"
            title={next?.name}
            onClick={() => go(next)}
          >
            {t("next")}
          </Button>
        </Stack>
        <div>
          <Typography variant="h5" fontWeight={700}>
            {playing.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatBytes(playing.size)} ·{" "}
            {format.dateTime(playing.modifiedAt, { dateStyle: "medium" })}
            {playing.relPath.includes("/")
              ? ` · ${playing.relPath.slice(0, playing.relPath.lastIndexOf("/"))}`
              : ""}
          </Typography>
        </div>
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          {t("upNext")}
        </Typography>
        {others.map((video) => {
          const active = video.id === playing.id;
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
