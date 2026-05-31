import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { trpc } from "@/trpc/server";
import { requireUser } from "@/server/auth/currentUser";
import type { ListVideosOutput, VideoFile } from "@/schemas/video";
import { WatchView } from "@/components/WatchView/WatchView";

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

  let data: ListVideosOutput;
  let current: VideoFile;
  try {
    [current, data] = await Promise.all([
      trpc.folder.video({ folderId, videoId }),
      trpc.folder.videos({ folderId }),
    ]);
  } catch {
    notFound();
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center">
          <Link href={`/folders/${folderId}`}>
            <Button startIcon={<ArrowBackIcon />} color="inherit">
              {t("back", { folder: data.folder.label })}
            </Button>
          </Link>
        </Stack>
        <WatchView
          folderId={folderId}
          current={current}
          videos={data.videos}
        />
      </Stack>
    </Container>
  );
}
