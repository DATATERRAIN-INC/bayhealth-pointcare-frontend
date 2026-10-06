"use client";

import { useId, useState } from "react";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import { Box, Menu, MenuItem, Typography } from "@mui/material";

export type ColumnFilterOption<T extends string = string> = {
  value: T | "all";
  label: string;
};

export function ColumnHeaderFilter<T extends string = string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | "all";
  options: ColumnFilterOption<T>[];
  onChange: (next: T | "all") => void;
}) {
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const active = value !== "all";
  const selectedLabel = options.find((option) => option.value === value)?.label ?? "All";

  return (
    <>
      <Box
        sx={{
          width: "100%",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0.75,
          minWidth: 0,
        }}
      >
        <Typography
          component="span"
          noWrap
          sx={{
            fontWeight: 650,
            fontSize: "var(--font-size-body)",
            color: "text.primary",
            lineHeight: 1.3,
            textAlign: "left",
            minWidth: 0,
          }}
        >
          {label}
        </Typography>
        <Box
          component="button"
          type="button"
          aria-label={active ? `Clear ${label} filter` : `Filter ${label}`}
          aria-controls={!active && open ? menuId : undefined}
          aria-haspopup={active ? undefined : "listbox"}
          aria-expanded={!active && open ? "true" : undefined}
          title={active ? `Clear ${label} filter (${selectedLabel})` : `Filter ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            if (active) {
              onChange("all");
              setAnchorEl(null);
              return;
            }
            setAnchorEl(event.currentTarget);
          }}
          sx={{
            display: "grid",
            placeItems: "center",
            width: 24,
            height: 24,
            p: 0,
            border: 0,
            borderRadius: "6px",
            bgcolor: active ? "#EAF3FB" : "transparent",
            color: active ? "primary.main" : "#8B93A7",
            cursor: "pointer",
            flexShrink: 0,
            ml: "auto",
            "&:hover": {
              bgcolor: active ? "#DCEAF8" : "#F1F4F8",
              color: active ? "primary.main" : "#526071",
            },
          }}
        >
          {active ? <FilterAltOffIcon sx={{ fontSize: 16 }} /> : <FilterAltIcon sx={{ fontSize: 16 }} />}
        </Box>
      </Box>

      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.75,
              minWidth: 180,
              borderRadius: "10px",
              border: "1px solid #E5E9EF",
              boxShadow: "0 10px 30px rgb(28 42 107 / 0.12)",
            },
          },
          list: {
            dense: true,
            sx: { py: 0.5 },
          },
        }}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <MenuItem
              key={String(option.value)}
              selected={selected}
              onClick={() => {
                onChange(option.value);
                setAnchorEl(null);
              }}
              sx={{
                mx: 0.5,
                borderRadius: "7px",
                fontSize: "var(--font-size-body)",
                fontWeight: selected ? 650 : 500,
                color: selected ? "primary.main" : "text.primary",
                bgcolor: selected ? "#EAF3FB" : "transparent",
                "&.Mui-selected": { bgcolor: "#EAF3FB" },
                "&.Mui-selected:hover": { bgcolor: "#DCEAF8" },
              }}
            >
              {option.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
