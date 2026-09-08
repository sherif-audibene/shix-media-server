import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { trpc } from "@/trpc/server";
import { requireUser } from "@/server/auth/currentUser";
import { VideoBrowser } from "@/components/VideoBrowser/VideoBrowser";
import { folderHref, parentPath } from "@/lib/video";

export default async function FolderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; folderId: string }>;
  searchParams: Promise<{ path?: string }>;
}) {
  const { locale, folderId } = await params;
  const { path = "" } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireUser();

  const t = await getTranslations("Folders");
  const folders = await trpc.folder.list();
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) notFound();

  // Back walks one level up the directory tree, leaving the folder only from
  // its root.
  const parent = parentPath(path);

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Link
            href={parent === null ? "/folders" : folderHref(folderId, parent)}
          >
            <Button startIcon={<ArrowBackIcon />} color="inherit">
              {parent === null
                ? t("back")
                : parent === ""
                  ? folder.label
                  : parent.slice(parent.lastIndexOf("/") + 1)}
            </Button>
          </Link>
        </Stack>
        <Typography variant="h4" component="h1" fontWeight={700}>
          {folder.label}
        </Typography>
        <VideoBrowser folderId={folder.id} />
      </Stack>
    </Container>
  );
}
