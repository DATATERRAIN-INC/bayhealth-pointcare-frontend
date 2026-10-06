"use client";

import {
  Button as MuiButton,
  CircularProgress,
  type ButtonProps as MuiButtonProps,
  type SxProps,
  type Theme,
} from "@mui/material";
import { forwardRef } from "react";

type AppButtonVariant = "primary" | "soft" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends Omit<MuiButtonProps, "variant" | "size"> {
  variant?: AppButtonVariant | MuiButtonProps["variant"];
  loading?: boolean;
  size?: "small" | "medium" | "large" | "sm" | "md";
}

function isAppVariant(variant: ButtonProps["variant"]): variant is AppButtonVariant {
  return (
    variant === "primary" ||
    variant === "soft" ||
    variant === "secondary" ||
    variant === "ghost" ||
    variant === "danger"
  );
}

function mapVariant(
  variant: ButtonProps["variant"]
): MuiButtonProps["variant"] {
  switch (variant) {
    case "primary":
    case "soft":
    case "secondary":
    case "danger":
      return "contained";
    case "ghost":
      return "text";
    default:
      return variant ?? "contained";
  }
}

function mapSize(size: ButtonProps["size"]): MuiButtonProps["size"] {
  if (size === "sm") return "small";
  if (size === "md") return "medium";
  return size ?? "medium";
}

function mapColor(variant: ButtonProps["variant"], color?: MuiButtonProps["color"]): MuiButtonProps["color"] {
  if (color) return color;
  if (variant === "danger") return "error";
  if (variant === "secondary" || variant === "ghost" || variant === "soft") return "inherit";
  return "primary";
}

const variantSx: Record<AppButtonVariant, SxProps<Theme>> = {
  primary: {
    backgroundColor: "#2F72B9",
    color: "#FFFFFF",
    border: "1px solid #2F72B9",
    boxShadow: "0 1px 2px rgb(47 114 185 / 0.28)",
    "&:hover": {
      backgroundColor: "#245C96",
      borderColor: "#245C96",
      boxShadow: "0 1px 2px rgb(47 114 185 / 0.32)",
    },
    "&.Mui-disabled": {
      backgroundColor: "#B7CFE6",
      color: "#FFFFFF",
      borderColor: "#B7CFE6",
      boxShadow: "none",
    },
  },
  soft: {
    backgroundColor: "#E8F3FC",
    color: "#2F72B9",
    border: "1px solid #C5DFF5",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "#D7EAF9",
      borderColor: "#A8D0F0",
      boxShadow: "none",
    },
    "&.Mui-disabled": {
      backgroundColor: "#F2F8FC",
      color: "#9DBFE0",
      borderColor: "#E0EEF8",
      boxShadow: "none",
    },
  },
  secondary: {
    backgroundColor: "#F2F4F7",
    color: "#344054",
    border: "1px solid #D0D5DD",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "#E4E7EC",
      borderColor: "#CDD2DA",
      boxShadow: "none",
    },
    "&.Mui-disabled": {
      backgroundColor: "#F9FAFB",
      color: "#98A2B3",
      borderColor: "#E4E7EC",
      boxShadow: "none",
    },
  },
  ghost: {
    backgroundColor: "transparent",
    color: "#4B5565",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "#F3F4F6",
      boxShadow: "none",
    },
  },
  danger: {
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
    border: "1px solid #EF4444",
    boxShadow: "0 1px 2px rgb(239 68 68 / 0.25)",
    "&:hover": {
      backgroundColor: "#DC2626",
      borderColor: "#DC2626",
    },
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      color,
      sx,
      ...props
    },
    ref
  ) => {
    const toneSx = isAppVariant(variant) ? variantSx[variant] : undefined;

    return (
      <MuiButton
        ref={ref}
        variant={mapVariant(variant)}
        size={mapSize(size)}
        color={mapColor(variant, color)}
        disabled={disabled || loading}
        startIcon={
          loading ? <CircularProgress size={14} color="inherit" /> : undefined
        }
        {...props}
        sx={[toneSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])] as SxProps<Theme>}
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = "Button";
