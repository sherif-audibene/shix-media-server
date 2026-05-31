import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("Home");

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Stack spacing={3} alignItems="flex-start">
        <Typography variant="h3" component="h1" fontWeight={700}>
          {t("title")}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {t("subtitle")}
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Link href="/folders">
            <Button variant="contained" size="large">
              {t("browseVideos")}
            </Button>
          </Link>
          <Link href="/users">
            <Button variant="outlined" size="large">
              {t("viewUsers")}
            </Button>
          </Link>
        </Stack>
      </Stack>
    </Container>
  );
}
