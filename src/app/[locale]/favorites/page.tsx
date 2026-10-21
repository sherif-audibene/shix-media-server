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
import { VideoCard } from "@/components/VideoCard/VideoCard";
import { Grid } from "@/components/VideoGrid/VideoGrid.styled";

export const dynamic = "force-dynamic";

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireUser();
  const t = await getTranslations("Favorites");
  const tf = await getTranslations("Folders");

  const favorites = await trpc.folder.favorites();

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Stack direction="row" alignItems="center">
          <Link href="/folders">
            <Button startIcon={<ArrowBackIcon />} color="inherit">
              {tf("back")}
            </Button>
          </Link>
        </Stack>
        <Typography variant="h4" component="h1" fontWeight={700}>
          {t("title")}
        </Typography>
        {favorites.length === 0 ? (
          <Typography color="text.secondary">{t("empty")}</Typography>
        ) : (
          <Grid>
            {favorites.map(({ folderId, video }) => (
              <VideoCard
                key={`${folderId}/${video.id}`}
                folderId={folderId}
                video={video}
              />
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
