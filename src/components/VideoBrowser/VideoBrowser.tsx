"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { keepPreviousData } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";
import SearchIcon from "@mui/icons-material/Search";
import { api } from "@/trpc/react";
import { VideoGrid } from "@/components/VideoGrid/VideoGrid";

const PAGE_SIZE_OPTIONS = [50, 100, 200];
const DEFAULT_PAGE_SIZE = 100;

/** Fetches a folder's videos with server-side search + pagination. */
export function VideoBrowser({ folderId }: { folderId: string }) {
  const t = useTranslations("Videos");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Debounce the search input and reset to the first page on change.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const query = api.folder.videos.useQuery(
    { folderId, search: debounced || undefined, page, pageSize },
    { placeholderData: keepPreviousData },
  );

  const pageCount = useMemo(
    () => (query.data ? Math.max(1, Math.ceil(query.data.total / pageSize)) : 1),
    [query.data, pageSize],
  );

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
      >
        <TextField
          size="small"
          label={t("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label={t("perPage")}
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(0);
          }}
          sx={{ minWidth: 120 }}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={{ color: "text.secondary" }}>
        {t("count", { count: query.data?.total ?? 0 })}
      </Box>

      {query.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : query.isError ? (
        <Alert severity="error">{query.error.message}</Alert>
      ) : (
        <VideoGrid folderId={folderId} videos={query.data.videos} />
      )}

      {pageCount > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ pt: 1 }}>
          <Pagination
            count={pageCount}
            page={page + 1}
            onChange={(_, p) => setPage(p - 1)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Stack>
      )}
    </Stack>
  );
}
