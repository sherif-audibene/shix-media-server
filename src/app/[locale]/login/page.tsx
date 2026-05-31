import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Container from "@mui/material/Container";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/server/auth/currentUser";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // Already signed in → go straight to the app.
  if (await getCurrentUser()) redirect({ href: "/folders", locale });

  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </Container>
  );
}
