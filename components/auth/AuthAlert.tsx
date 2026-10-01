"use client";

import { Box, Typography } from "@mui/material";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type AuthAlertProps = {
  tone: "error" | "success";
  message: string;
};

export function AuthAlert({ tone, message }: AuthAlertProps) {
  const text = message.trim();
  if (!text) return null;

  const isError = tone === "error";

  return (
    <Box
      role="alert"
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        px: 1.75,
        py: 1.5,
        borderRadius: "10px",
        bgcolor: isError ? "#FDECEC" : "#ECFDF3",
        color: isError ? "#B42318" : "#027A48",
      }}
    >
      {isError ? (
        <InfoOutlinedIcon sx={{ fontSize: 20, mt: "1px", flexShrink: 0, color: "#D92D20" }} />
      ) : (
        <CheckCircleOutlinedIcon sx={{ fontSize: 20, mt: "1px", flexShrink: 0, color: "#12B76A" }} />
      )}
      <Typography
        sx={{
          fontSize: "var(--font-size-body)",
          lineHeight: 1.45,
          color: isError ? "#B42318" : "#027A48",
          wordBreak: "break-word",
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}
