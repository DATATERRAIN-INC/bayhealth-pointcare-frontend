import { createTheme } from "@mui/material/styles";
import { fontFamily, fontSizeVars, palette, typographyScale } from "./tokens";

declare module "@mui/material/styles" {
  interface PaletteColor {
    50?: string;
  }

  interface SimplePaletteColorOptions {
    50?: string;
  }
}

const softShadow = "0 1px 2px 0 rgb(15 23 42 / 0.04)";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { ...palette.primary },
    secondary: { ...palette.secondary },
    success: { ...palette.success },
    error: { ...palette.error },
    warning: { ...palette.warning },
    info: { ...palette.info },
    text: { ...palette.text },
    background: { ...palette.background },
    divider: palette.divider,
    grey: { ...palette.grey },
  },
  typography: {
    fontFamily: fontFamily.sans,
    fontSize: typographyScale.body,
    htmlFontSize: 16,
    h1: {
      fontSize: fontSizeVars.h1,
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: fontSizeVars.h2,
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: fontSizeVars.h3,
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: fontSizeVars.h3,
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h5: {
      fontSize: fontSizeVars.body,
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: fontSizeVars.body,
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: fontSizeVars.body,
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: fontSizeVars.small,
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: fontSizeVars.body,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: fontSizeVars.body,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontSize: fontSizeVars.body,
      fontWeight: 500,
      textTransform: "none",
      letterSpacing: 0,
    },
    caption: {
      fontSize: fontSizeVars.small,
      fontWeight: 400,
      lineHeight: 1.4,
    },
    overline: {
      fontSize: fontSizeVars.small,
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    "none",
    softShadow,
    "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
    "0 4px 6px -1px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.05)",
    "0 10px 15px -3px rgb(15 23 42 / 0.06), 0 4px 6px -4px rgb(15 23 42 / 0.05)",
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
    softShadow,
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.background.default,
          color: palette.text.primary,
          fontSize: fontSizeVars.body,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: fontSizeVars.body,
          fontWeight: 500,
          textTransform: "none",
          minHeight: "var(--button-height)",
          padding: "6px 14px",
        },
        sizeSmall: {
          fontSize: fontSizeVars.body,
          padding: "4px 12px",
        },
        sizeLarge: {
          fontSize: fontSizeVars.body,
          padding: "8px 18px",
        },
        contained: {
          "&.MuiButton-colorPrimary": {
            boxShadow: "0 1px 2px 0 rgb(37 99 235 / 0.2)",
            "&:hover": {
              boxShadow: "0 1px 2px 0 rgb(37 99 235 / 0.25)",
            },
          },
        },
        outlined: {
          borderColor: palette.divider,
          color: palette.grey[700],
          "&:hover": {
            borderColor: palette.grey[300],
            backgroundColor: palette.grey[50],
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            fontSize: fontSizeVars.body,
            borderRadius: 8,
            backgroundColor: palette.background.paper,
            minHeight: "var(--control-height)",
          },
          "& .MuiInputBase-root.MuiInputBase-sizeSmall": {
            height: "var(--control-height)",
          },
          "& .MuiInputLabel-root": {
            fontSize: fontSizeVars.body,
          },
          "& .MuiFormHelperText-root": {
            fontSize: fontSizeVars.small,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: fontSizeVars.body,
          minHeight: "var(--control-height)",
          overflow: "hidden",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.grey[300],
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.primary.main,
            borderWidth: 1,
          },
        },
        sizeSmall: {
          height: "var(--control-height)",
          "& .MuiOutlinedInput-input": {
            padding: "8.5px 12px",
          },
        },
        notchedOutline: {
          borderColor: palette.divider,
        },
        input: {
          fontSize: fontSizeVars.body,
          height: "100%",
          boxSizing: "border-box",
          "&:focus, &:focus-visible": {
            outline: "none",
          },
          "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active":
            {
              WebkitTextFillColor: palette.text.primary,
              caretColor: palette.text.primary,
              borderRadius: "inherit",
              transition: "background-color 99999s ease-out 0s",
              boxShadow: "0 0 0 1000px #FFFFFF inset",
              WebkitBoxShadow: "0 0 0 1000px #FFFFFF inset",
            },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: fontSizeVars.body,
          "&.MuiInputLabel-shrink": {
            fontSize: fontSizeVars.small,
          },
        },
      },
    },
    MuiCheckbox: {
      defaultProps: {
        color: "primary",
      },
      styleOverrides: {
        root: {
          color: palette.grey[300],
          "&.Mui-checked": {
            color: palette.primary.main,
          },
        },
      },
    },
    MuiRadio: {
      defaultProps: {
        color: "primary",
      },
      styleOverrides: {
        root: {
          color: palette.grey[300],
          "&.Mui-checked": {
            color: palette.primary.main,
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: fontSizeVars.body,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: fontSizeVars.body,
          fontWeight: 500,
          textTransform: "none",
          minHeight: 44,
          color: palette.text.secondary,
          "&.Mui-selected": {
            color: palette.primary.main,
            fontWeight: 600,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: palette.primary.main,
          height: 2,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: fontSizeVars.small,
          fontWeight: 500,
          borderRadius: 999,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: palette.divider,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          borderColor: palette.divider,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: fontFamily.sans,
          fontSize: fontSizeVars.body,
          fontWeight: 400,
          color: palette.text.primary,
          borderColor: palette.grey[100],
        },
        head: {
          fontSize: fontSizeVars.body,
          fontWeight: 600,
          color: palette.text.primary,
          backgroundColor: palette.grey[50],
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: fontSizeVars.body,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: fontSizeVars.small,
          backgroundColor: palette.grey[800],
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: fontSizeVars.h3,
          fontWeight: 600,
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          fontSize: fontSizeVars.body,
          color: palette.text.secondary,
        },
      },
    },
  },
});
