"use client";

import { useTranslations } from "next-intl";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import LogoutIcon from "@mui/icons-material/Logout";
import { api } from "@/trpc/react";
import { Link, useRouter } from "@/i18n/navigation";

export interface AppHeaderProps {
  user: { name: string } | null;
}

/** Top bar showing the app name and a login/logout control. */
export function AppHeader({ user }: AppHeaderProps) {
  const t = useTranslations("Auth");
  const router = useRouter();

  const logout = api.auth.logout.useMutation({
    onSuccess: () => {
      router.replace("/login");
      router.refresh();
    },
  });

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{ fontWeight: 700, color: "inherit", textDecoration: "none" }}
        >
          next-trpc-grid
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {user ? (
          <>
            <Typography variant="body2" sx={{ mr: 2 }} color="text.secondary">
              {user.name}
            </Typography>
            <Button
              startIcon={<LogoutIcon />}
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              {t("signOut")}
            </Button>
          </>
        ) : (
          <Button component={Link} href="/login">
            {t("signIn")}
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
