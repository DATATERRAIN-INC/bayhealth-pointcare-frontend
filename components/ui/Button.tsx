"use client";

import {
  Button as MuiButton,
  CircularProgress,
  type ButtonProps as MuiButtonProps,
} from "@mui/material";
import { forwardRef } from "react";

export interface ButtonProps extends Omit<MuiButtonProps, "variant" | "size"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | MuiButtonProps["variant"];
  loading?: boolean;
  size?: "small" | "medium" | "large" | "sm" | "md";
}

function mapVariant(
  variant: ButtonProps["variant"]
): MuiButtonProps["variant"] {
  switch (variant) {
    case "primary":
      return "contained";
    case "secondary":
      return "outlined";
    case "ghost":
      return "text";
    case "danger":
      return "contained";
    default:
      return variant ?? "contained";
  }
}

function mapSize(size: ButtonProps["size"]): MuiButtonProps["size"] {
  if (size === "sm") return "small";
  if (size === "md") return "medium";
  return size ?? "medium";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      color,
      ...props
    },
    ref
  ) => {
    return (
      <MuiButton
        ref={ref}
        variant={mapVariant(variant)}
        size={mapSize(size)}
        color={variant === "danger" ? "error" : color ?? "primary"}
        disabled={disabled || loading}
        startIcon={
          loading ? <CircularProgress size={14} color="inherit" /> : undefined
        }
        {...props}
      >
        {children}
      </MuiButton>
    );
  }
);

Button.displayName = "Button";
