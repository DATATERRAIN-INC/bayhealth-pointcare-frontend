"use client";

import {
  IconButton,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";

export const DEFAULT_PAGE_SIZE = 5;
export const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export interface TablePagerProps {
  page: number;
  pageSize: number;
  rowCount: number;
  pageSizeOptions?: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/** Shared table footer: page size + prev/next. Default page size is 5. */
export function TablePager({
  page,
  pageSize,
  rowCount,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
}: TablePagerProps) {
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));
  const isFirstPage = page <= 0;
  const isLastPage = page >= totalPages - 1;
  const rangeStart = rowCount === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = Math.min((page + 1) * pageSize, rowCount);

  return (
    <Stack
      direction="row"
      sx={{
        width: "100%",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: { xs: 1.5, sm: 2.5 },
        minHeight: 52,
        px: { xs: 1.5, sm: 2 },
        borderTop: "1px solid #EEF0F4",
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#5F6675", whiteSpace: "nowrap" }}>
          Rows per page:
        </Typography>
        <Select
          size="small"
          value={pageSize}
          onChange={(event) => {
            onPageSizeChange(Number(event.target.value));
            onPageChange(0);
          }}
          aria-label="Rows per page"
          sx={{
            minWidth: 48,
            fontSize: "var(--font-size-body)",
            color: "#3F4654",
            "& .MuiSelect-select": { py: 0.5, pl: 1, pr: "24px !important" },
            "& .MuiOutlinedInput-notchedOutline": { border: 0 },
          }}
        >
          {pageSizeOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
        <Typography sx={{ mr: 1, fontSize: "var(--font-size-body)", color: "#5F6675", whiteSpace: "nowrap" }}>
          {rangeStart}–{rangeEnd} of {rowCount}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onPageChange(page - 1)}
          disabled={isFirstPage}
          aria-label="Previous page"
          sx={{ width: 32, height: 32 }}
        >
          <KeyboardArrowLeft fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onPageChange(page + 1)}
          disabled={isLastPage}
          aria-label="Next page"
          sx={{ width: 32, height: 32 }}
        >
          <KeyboardArrowRight fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
}
