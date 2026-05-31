import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/providers/Providers";
import { AppHeader } from "@/components/layout/AppHeader";
import { getCurrentUser } from "@/server/auth/currentUser";
import "@/app/globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "next-trpc-grid",
  description: "Next.js 15 + tRPC v11 + MUI v7 + next-intl starter",
};

/** Pre-render every supported locale at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Enables static rendering for this locale.
  setRequestLocale(locale);

  const user = await getCurrentUser();

  return (
    <html lang={locale} className={roboto.variable}>
      <body>
        <NextIntlClientProvider>
          <Providers>
            <AppHeader user={user ? { name: user.name } : null} />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
