import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { trpc } from "@/trpc/server";
import { requireUser } from "@/server/auth/currentUser";
import { videoSubPath } from "@/server/config/folders";
import type {
  ListVideosOutput,
  VideoFile,
  VideoFolderNode,
} from "@/schemas/video";
import { WatchView } from "@/components/WatchView/WatchView";
import { folderHref, folderSiblings } from "@/lib/video";

export const dynamic = "force-dynamic";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ locale: string; folderId: string; videoId: string }>;
}) {
  const { locale, folderId, videoId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireUser();
  const t = await getTranslations("Watch");
  const tVideos = await getTranslations("Videos");

  let data: ListVideosOutput;
  let current: VideoFile;
  let tree: VideoFolderNode[];
  try {
    current = await trpc.folder.video({ folderId, videoId });
    // The "more in this folder" rail lists only the current video's
    // sub-folder, sorted by name, with enough room to hold the whole folder.
    data = await trpc.folder.videos({
      folderId,
      subPath: videoSubPath(current.relPath),
      pageSize: 500,
    });
    tree = await trpc.folder.tree({ folderId });
  } catch {
    notFound();
  }

  // Back returns to the sub-folder the video lives in, not the folder root.
  const subPath = videoSubPath(current.relPath);
  const [prevSibling, nextSibling] = folderSiblings(tree, subPath);
  const siblingNav = [
    { node: prevSibling, label: "prevFolder", Icon: ChevronLeftIcon },
    { node: nextSibling, label: "nextFolder", Icon: ChevronRightIcon },
  ] as const;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center">
          <Link href={folderHref(folderId, subPath)}>
            <Button startIcon={<ArrowBackIcon />} color="inherit">
              {t("back", {
                folder: subPath
                  ? subPath.slice(subPath.lastIndexOf("/") + 1)
                  : data.folder.label,
              })}
            </Button>
          </Link>
          {subPath !== "" &&
            siblingNav.map(({ node, label, Icon }) =>
              node ? (
                <Tooltip
                  key={label}
                  title={tVideos(label, { name: node.name })}
                >
                  <Link href={folderHref(folderId, node.path)}>
                    <IconButton
                      size="small"
                      aria-label={tVideos(label, { name: node.name })}
                    >
                      <Icon />
                    </IconButton>
                  </Link>
                </Tooltip>
              ) : (
                <IconButton key={label} size="small" disabled>
                  <Icon />
                </IconButton>
              ),
            )}
        </Stack>
        <WatchView folderId={folderId} current={current} videos={data.videos} />
      </Stack>
    </Container>
  );
}
