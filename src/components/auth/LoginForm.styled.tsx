"use client";

import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";

/** Centered card containing the login form. */
export const LoginCard = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 400,
  margin: "0 auto",
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));
