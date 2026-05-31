import { defineRouting } from "next-intl/routing";

/** Supported locales. Keep in sync with the files under `messages/`. */
export const locales = ["en", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
