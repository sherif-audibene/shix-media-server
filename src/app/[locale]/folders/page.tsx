import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Alert from "@mui/material/Alert";
import FolderIcon from "@mui/icons-material/Folder";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { trpc } from "@/trpc/server";
import { requireUser } from "@/server/auth/currentUser";
import { Grid } from "@/components/VideoGrid/VideoGrid.styled";

// Folder config is read from env at request time, not baked at build.
export const dynamic = "force-dynamic";

export default async function FoldersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireUser();
  const t = await getTranslations("Folders");

  const folders = await trpc.folder.list();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          {t("title")}
        </Typography>

        {folders.length === 0 ? (
          <Alert severity="info">{t("configHint")}</Alert>
        ) : (
          <Grid>
            {folders.map((folder) => (
              <Link key={folder.id} href={`/folders/${folder.id}`}>
                <Card variant="outlined">
                  <CardActionArea>
                    <CardContent>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                      >
                        <FolderIcon color="primary" />
                        <Typography variant="h6" noWrap title={folder.label}>
                          {folder.label}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Link>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
