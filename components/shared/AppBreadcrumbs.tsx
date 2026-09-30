"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Box,
  Breadcrumbs as MuiBreadcrumbs,
  Tooltip,
  Typography,
} from "@mui/material";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  return (
    <Box component="nav" aria-label="Breadcrumb" sx={{ width: "100%", overflowX: "auto" }}>
      <MuiBreadcrumbs
        separator={<ChevronRight size={14} aria-hidden="true" />}
        sx={{
          minWidth: "max-content",
          "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" },
          "& .MuiBreadcrumbs-separator": { mx: 0.75, color: "#94A3B8" },
        }}
      >
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          const content = (
            <Tooltip title={item.label} placement="bottom" arrow>
              <Typography
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  maxWidth: { xs: 140, sm: 220 },
                  overflow: "hidden",
                  color: isCurrent ? "text.primary" : "primary.main",
                  fontWeight: isCurrent ? 600 : 500,
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.icon}
                <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.label}
                </Box>
              </Typography>
            </Tooltip>
          );

          if (item.onClick) {
            return (
              <Box
                component="button"
                type="button"
                key={`${item.label}-${index}`}
                onClick={item.onClick}
                sx={{
                  p: 0,
                  border: 0,
                  bgcolor: "transparent",
                  cursor: "pointer",
                  font: "inherit",
                  "&:hover span": { color: "primary.dark" },
                }}
              >
                {content}
              </Box>
            );
          }

          if (item.href && !isCurrent) {
            return (
              <Box
                component={Link}
                key={`${item.label}-${index}`}
                href={item.href}
                sx={{ textDecoration: "none", "&:hover span": { color: "primary.dark" } }}
              >
                {content}
              </Box>
            );
          }

          return (
            <Box key={`${item.label}-${index}`} aria-current={isCurrent ? "page" : undefined}>
              {content}
            </Box>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}
