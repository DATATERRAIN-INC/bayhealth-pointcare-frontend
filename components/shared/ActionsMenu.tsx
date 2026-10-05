"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { Box, IconButton, ListItemIcon, Menu, MenuItem } from "@mui/material";

export interface ActionsMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
}

export interface ActionsMenuProps {
  name: string;
  items: ActionsMenuItem[];
  menuWidth?: number;
}

const MENU_CLOSE_DELAY_MS = 120;

/** Shared ⋮ trigger + MUI Menu driven by a declarative items array. */
export function ActionsMenu({ name, items, menuWidth = 180 }: ActionsMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  function openMenu(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    setAnchor(event.currentTarget);
  }

  function closeMenu() {
    setAnchor(null);
  }

  return (
    <>
      <IconButton
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={anchor ? "true" : undefined}
        onClick={openMenu}
        sx={{
          width: 36,
          height: 36,
          bgcolor: "#F2F4F7",
          "&:hover": { bgcolor: "#E7EBF0" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }} aria-hidden>
          {[0, 1, 2].map((dot) => (
            <Box key={dot} sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#E11D48" }} />
          ))}
        </Box>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: menuWidth, mt: 0.5, borderRadius: "10px", boxShadow: "0 10px 32px rgba(15, 23, 42, 0.14), 0 2px 10px rgba(15, 23, 42, 0.06)", border: "1px solid #F1F5F9" } } }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.key}
            disabled={item.disabled}
            onClick={() => {
              closeMenu();
              window.setTimeout(() => item.onClick(), MENU_CLOSE_DELAY_MS);
            }}
            sx={{ fontSize: "var(--font-size-body)", color: item.color }}
          >
            {item.icon ? (
              <ListItemIcon sx={{ minWidth: 32, color: item.color ? "inherit" : undefined }}>
                {item.icon}
              </ListItemIcon>
            ) : null}
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
