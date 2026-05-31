import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { routing } from "@/i18n/routing";
import { requireUser } from "@/server/auth/currentUser";
import { UserTableContainer } from "@/components/UserTable";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await requireUser();
  const t = await getTranslations("Users");

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          {t("title")}
        </Typography>
        <UserTableContainer />
      </Stack>
    </Container>
  );
}
