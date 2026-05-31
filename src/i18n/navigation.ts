import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

/** Locale-aware navigation primitives — use these instead of next/link etc. */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
