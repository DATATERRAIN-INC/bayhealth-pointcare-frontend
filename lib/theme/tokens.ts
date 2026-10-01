/**
 * Design tokens for Gap in Care.
 * Mirrored as CSS variables in app/globals.css — keep both in sync.
 */

export const typographyScale = {
  /** Body / inputs / menus */
  body: 14,
  /** Labels, table extras, badges, captions */
  small: 14,
  /** Section headings */
  h3: 20,
  /** Page titles */
  h2: 25,
  /** Hero / display */
  h1: 36,
  /** Table pagination from md breakpoint */
  paginationMd: 16,
} as const;

export const fontFamily = {
  sans: [
    "var(--font-plus-jakarta)",
    '"Plus Jakarta Sans"',
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ].join(","),
  fallback: [
    "var(--font-geist-sans)",
    "ui-sans-serif",
    "system-ui",
    "sans-serif",
  ].join(","),
} as const;

/** CSS custom properties — preferred over hardcoded px in theme overrides */
export const fontSizeVars = {
  body: "var(--font-size-body)",
  small: "var(--font-size-small)",
  h1: "var(--font-size-h1)",
  h2: "var(--font-size-h2)",
  h3: "var(--font-size-h3)",
  paginationMd: "var(--font-size-pagination-md)",
} as const;

export const palette = {
  primary: {
    main: "#2F72B9",
    light: "#5B94D0",
    dark: "#245C96",
    contrastText: "#FFFFFF",
    50: "#E8F3FC",
  },
  secondary: {
    main: "#64748B",
    light: "#94A3B8",
    dark: "#475569",
    contrastText: "#FFFFFF",
  },
  success: {
    main: "#10B981",
    light: "#34D399",
    dark: "#059669",
    contrastText: "#FFFFFF",
    50: "#ECFDF5",
  },
  error: {
    main: "#EF4444",
    light: "#F87171",
    dark: "#DC2626",
    contrastText: "#FFFFFF",
    50: "#FEF2F2",
  },
  warning: {
    main: "#F59E0B",
    light: "#FDE68A",
    dark: "#D97706",
    contrastText: "#FFFFFF",
  },
  info: {
    main: "#3B82F6",
    light: "#60A5FA",
    dark: "#2563EB",
    contrastText: "#FFFFFF",
  },
  text: {
    primary: "#0F172A",
    secondary: "#6B7280",
    disabled: "#94A3B8",
  },
  background: {
    default: "#F8F9FB",
    paper: "#FFFFFF",
  },
  divider: "#E2E8F0",
  grey: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
} as const;
