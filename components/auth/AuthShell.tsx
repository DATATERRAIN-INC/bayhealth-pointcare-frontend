"use client";

import { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { BachLogo } from "@/components/brand/BachLogo";

const highlights = [
  { label: "Add patients", color: "#3EC6E0" },
  { label: "Track calls", color: "#2F72B9" },
  { label: "Review transcripts", color: "#1C2A6B" },
];

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <Box
      sx={{
        display: "grid",
        minHeight: "100vh",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.08fr) minmax(0, 0.92fr)" },
        bgcolor: "#FFFFFF",
      }}
    >
      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          bgcolor: "#EAF5FB",
          pl: { lg: 6, xl: 8 },
          pr: { lg: 5, xl: 7 },
          py: { lg: 5, xl: 6 },
        }}
      >
        <BachLogo showTagline width={300} />

        <Box sx={{ maxWidth: 620, width: "100%", pr: { lg: 2, xl: 4 } }}>
          <Typography
            sx={{
              fontSize: "var(--font-size-body)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#7A8BA0",
            }}
          >
            GAP IN CARE MODULE
          </Typography>
          <Typography
            sx={{
              mt: 2.5,
              fontSize: { lg: 30, xl: 36 },
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: "text.primary",
            }}
          >
            Close care gaps with AI-assisted outreach calls.
          </Typography>
          <Typography
            sx={{
              mt: 2.75,
              maxWidth: 560,
              fontSize: { lg: 14, xl: 15 },
              lineHeight: 1.6,
              color: "#4B5A6B",
            }}
          >
            Add patient records, track every outreach call, and review call transcripts in one place.
          </Typography>
        </Box>

        <Stack direction="row" spacing={4}>
          {highlights.map((item) => (
            <Stack key={item.label} direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: item.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: "var(--font-size-body)", fontWeight: 600, color: "#1C2A6B" }}>
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Box
        component="main"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 5, lg: 5, xl: 7 },
          py: { xs: 5, lg: 6 },
          bgcolor: "#FFFFFF",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 460 }}>
          <Box sx={{ mb: 4, display: { xs: "block", lg: "none" } }}>
            <BachLogo showTagline width={200} />
          </Box>

          <Box sx={{ mb: 3.5 }}>
            <Typography
              sx={{
                fontSize: { xs: 32, lg: 36 },
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "text.primary",
                lineHeight: 1.15,
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ mt: 1, fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.5 }}>
              {subtitle}
            </Typography>
          </Box>

          {children}

          <Typography sx={{ mt: 4, fontSize: "var(--font-size-body)", color: "#9AA3B2", lineHeight: 1.5 }}>
            Authorised users only. Contact your administrator for access.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
