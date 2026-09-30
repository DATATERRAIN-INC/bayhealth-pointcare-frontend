"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Button } from "@/components/ui/Button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || "Something went wrong.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("PointCare UI error:", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Stack
          spacing={1.5}
          sx={{
            minHeight: 240,
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 4,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 650, color: "text.primary" }}>
            {this.props.fallbackTitle ?? "Something went wrong"}
          </Typography>
          <Typography sx={{ fontSize: "var(--font-size-body)", color: "#6B7280", maxWidth: 420 }}>
            {this.state.message}
          </Typography>
          <Box>
            <Button type="button" onClick={this.handleRetry}>
              Try again
            </Button>
          </Box>
        </Stack>
      );
    }

    return this.props.children;
  }
}
