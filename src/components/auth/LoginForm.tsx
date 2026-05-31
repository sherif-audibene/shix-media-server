"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { api } from "@/trpc/react";
import { useRouter } from "@/i18n/navigation";
import { LoginCard } from "@/components/auth/LoginForm.styled";

/** Username/password form that creates a session via the auth router. */
export function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = api.auth.login.useMutation({
    onSuccess: () => {
      router.replace(next && next.startsWith("/") ? next : "/folders");
      router.refresh();
    },
  });

  return (
    <LoginCard elevation={0}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate({ username, password });
        }}
      >
        <Stack spacing={3}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          {t("title")}
        </Typography>

        {login.isError && (
          <Alert severity="error">{t("invalid")}</Alert>
        )}

        <TextField
          label={t("username")}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
          required
          fullWidth
        />
        <TextField
          label={t("password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          fullWidth
        />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={login.isPending}
          >
            {t("signIn")}
          </Button>
        </Stack>
      </form>
    </LoginCard>
  );
}
