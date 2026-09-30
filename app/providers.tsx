"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { theme } from "@/lib/theme";

interface AppProvidersProps {
  children: ReactNode;
}

/** Client-side app providers for the App Router root layout. */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ReduxProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ReduxProvider>
    </AppRouterCacheProvider>
  );
}
