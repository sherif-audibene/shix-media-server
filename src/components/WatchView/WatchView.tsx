"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import MovieIcon from "@mui/icons-material/Movie";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import type { VideoFile } from "@/schemas/video";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/trpc/react";
import {
  folderHref,
  formatBytes,
  videoStreamUrl,
  videoThumbnailUrl,
  watchHref,
  type WatchItem,
  type WatchList,
} from "@/lib/video";
import {
  Layout,
  Overlay,
  PlayerSurface,
  UpNextItem,
} from "@/components/WatchView/WatchView.styled";

/** localStorage key for the cinema-mode preference. */
const CINEMA_KEY = "shix:cinema";

/** iOS Safari has no Element.requestFullscreen; it flags the video instead. */
type MaybeIosVideo = HTMLVideoElement & {
  webkitDisplayingFullscreen?: boolean;
  webkitEnterFullscreen?: () => void;
};

/** True while a video is showing fullscreen, including iOS's native player. */
function isFullscreen(video: HTMLVideoElement | null): boolean {
  return Boolean(
    document.fullscreenElement ||
    (video as MaybeIosVideo | null)?.webkitDisplayingFullscreen,
  );
}

export interface WatchViewProps {
  current: WatchItem;
  /** Playback queue, already in play order (may span folders). */
  items: WatchItem[];
  /** Queue the page was opened from; kept on every link so it sticks. */
  list?: WatchList;
}

/** Stable identity for a queue entry (video ids are only unique per folder). */
const keyOf = ({ folderId, video }: WatchItem) => `${folderId}/${video.id}`;

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
export function WatchView({ current, items, list }: WatchViewProps) {
  const t = useTranslations("Watch");
  const tFavorites = useTranslations("Favorites");
  const format = useFormatter();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // What the player shows: normally the server-rendered video, but cinema
  // mode swaps it in place (no route change) to keep fullscreen alive.
  const [playing, setPlaying] = useState(current);
  const { folderId, video: playingVideo } = playing;
  const playingKey = keyOf(playing);
  const currentKey = keyOf(current);
  const [cinema, setCinema] = useState(false);

  useEffect(() => {
    const sync = () => setFullscreen(isFullscreen(videoRef.current));
    document.addEventListener("fullscreenchange", sync);
    const el = videoRef.current;
    el?.addEventListener("webkitbeginfullscreen", sync);
    el?.addEventListener("webkitendfullscreen", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      el?.removeEventListener("webkitbeginfullscreen", sync);
      el?.removeEventListener("webkitendfullscreen", sync);
    };
  }, []);

  // localStorage exists only on the client, so read the flag after mount.
  useEffect(() => setCinema(localStorage.getItem(CINEMA_KEY) === "1"), []);

  // A real navigation (rail click, direct link, back button) always wins.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPlaying(current), [currentKey]);

  // Same element, new source: reload and keep going. Remounting the <video>
  // — which a route change does — would drop the fullscreen session.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.load();
    void el.play().catch(() => {});
  }, [playingKey]);

  // Neighbours in the queue: previous, and the next one — which also plays
  // automatically when this video ends.
  const [previous, next] = useMemo(() => {
    const index = items.findIndex((item) => keyOf(item) === playingKey);
    return index < 0
      ? [undefined, undefined]
      : [items[index - 1], items[index + 1]];
  }, [items, playingKey]);

  /**
   * Move to another video. While fullscreen, swap the source in place so the
   * session survives — but only let a finished video carry on by itself when
   * cinema mode is on; a click is always meant to stay fullscreen.
   */
  const go = useCallback(
    (item: WatchItem | undefined, autoplayed = false) => {
      if (!item) return;
      if (isFullscreen(videoRef.current) && (cinema || !autoplayed))
        setPlaying(item);
      else router.push(watchHref(item.folderId, item.video.id, list));
    },
    [cinema, list, router],
  );

  const utils = api.useUtils();
  const ref = { folderId, videoId: playingVideo.id };
  const favorite = api.folder.isFavorite.useQuery(ref);
  const setFavorite = api.folder.setFavorite.useMutation({
    onSuccess: (value) => utils.folder.isFavorite.setData(ref, value),
  });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const remove = api.folder.delete.useMutation({
    onSuccess: () => {
      setConfirmDelete(false);
      // Carry on with a neighbour; if it was the last one, back to its folder.
      const neighbour = next ?? previous;
      const dir = playingVideo.relPath.includes("/")
        ? playingVideo.relPath.slice(0, playingVideo.relPath.lastIndexOf("/"))
        : "";
      router.replace(
        neighbour
          ? watchHref(neighbour.folderId, neighbour.video.id, list)
          : list
            ? "/favorites"
            : folderHref(folderId, dir),
      );
      router.refresh();
    },
  });

  /** Fullscreen the container, so the overlay can sit above the picture. */
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    const surface = surfaceRef.current;
    if (surface?.requestFullscreen) {
      void surface.requestFullscreen().catch(() => {});
      return;
    }
    // iOS: only the video itself can go fullscreen, so no overlay there.
    (videoRef.current as MaybeIosVideo | null)?.webkitEnterFullscreen?.();
  }, []);

  // In-place swaps leave the URL pointing at the video we started from; put
  // it back in sync as soon as the user leaves fullscreen.
  useEffect(() => {
    if (playingKey === currentKey) return;
    const el = videoRef.current;
    const sync = () => {
      if (!isFullscreen(el))
        router.replace(watchHref(folderId, playingVideo.id, list));
    };
    document.addEventListener("fullscreenchange", sync);
    el?.addEventListener("webkitendfullscreen", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      el?.removeEventListener("webkitendfullscreen", sync);
    };
  }, [playingKey, currentKey, folderId, playingVideo.id, list, router]);

  return (
    <Layout>
      <Stack spacing={2}>
        <PlayerSurface ref={surfaceRef}>
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            preload="metadata"
            onEnded={() => go(next, true)}
          >
            <source
              src={videoStreamUrl(folderId, playingVideo.id)}
              type={playingVideo.mimeType}
            />
          </video>
          <Overlay className="overlay">
            <IconButton
              className="skip prev"
              disabled={!previous}
              aria-label={t("previous")}
              title={previous?.video.name ?? t("previous")}
              onClick={() => go(previous)}
            >
              <SkipPreviousIcon fontSize="large" />
            </IconButton>
            <IconButton
              className="skip next"
              disabled={!next}
              aria-label={t("next")}
              title={next?.video.name ?? t("next")}
              onClick={() => go(next)}
            >
              <SkipNextIcon fontSize="large" />
            </IconButton>
            <IconButton
              className="fullscreen"
              aria-label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
              title={fullscreen ? t("exitFullscreen") : t("fullscreen")}
              onClick={toggleFullscreen}
            >
              {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Overlay>
        </PlayerSurface>
        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button
            disabled={!previous}
            startIcon={<SkipPreviousIcon />}
            color="inherit"
            title={previous?.video.name}
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
            title={next?.video.name}
            onClick={() => go(next)}
          >
            {t("next")}
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={700}>
              {playingVideo.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatBytes(playingVideo.size)} ·{" "}
              {format.dateTime(playingVideo.modifiedAt, {
                dateStyle: "medium",
              })}
              {playingVideo.relPath.includes("/")
                ? ` · ${playingVideo.relPath.slice(0, playingVideo.relPath.lastIndexOf("/"))}`
                : ""}
            </Typography>
          </div>
          <IconButton
            color="warning"
            disabled={favorite.isPending || setFavorite.isPending}
            aria-label={favorite.data ? t("unfavorite") : t("favorite")}
            title={favorite.data ? t("unfavorite") : t("favorite")}
            onClick={() =>
              setFavorite.mutate({ ...ref, favorite: !favorite.data })
            }
          >
            {favorite.data ? <StarIcon /> : <StarBorderIcon />}
          </IconButton>
          <IconButton
            color="error"
            aria-label={t("delete")}
            title={t("delete")}
            onClick={() => setConfirmDelete(true)}
          >
            <DeleteForeverIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Dialog
        open={confirmDelete}
        onClose={() => !remove.isPending && setConfirmDelete(false)}
      >
        <DialogTitle>{t("deleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("deleteBody", { name: playingVideo.name })}
          </DialogContentText>
          {remove.isError && (
            <DialogContentText color="error" sx={{ mt: 1 }}>
              {remove.error.message}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={remove.isPending}
            onClick={() => setConfirmDelete(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={remove.isPending}
            onClick={() => remove.mutate(ref)}
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Stack spacing={1.5}>
        <Typography variant="subtitle1" fontWeight={600}>
          {list ? tFavorites("title") : t("upNext")}
        </Typography>
        {items.map((item) => {
          const { video } = item;
          const key = keyOf(item);
          const active = key === playingKey;
          return (
            <Link key={key} href={watchHref(item.folderId, video.id, list)}>
              <UpNextItem data-active={active}>
                <RailThumb folderId={item.folderId} video={video} />
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
