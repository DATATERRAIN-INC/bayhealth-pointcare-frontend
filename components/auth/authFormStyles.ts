export const authFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    bgcolor: "#FFFFFF",
    "& fieldset": {
      borderColor: "#D5DBE5",
    },
    "&:hover fieldset": {
      borderColor: "#B8C0CE",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      borderWidth: 1.5,
    },
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "var(--font-size-body)",
    py: 0,
  },
} as const;

export const authOtpFieldSx = {
  width: { xs: 44, sm: 48 },
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    bgcolor: "#FFFFFF",
    height: { xs: 48, sm: 52 },
    "& fieldset": {
      borderColor: "#D5DBE5",
    },
    "&:hover fieldset": {
      borderColor: "#B8C0CE",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      borderWidth: 1.5,
    },
  },
  "& .MuiOutlinedInput-input": {
    textAlign: "center",
    fontSize: 18,
    fontWeight: 600,
    py: 0,
    px: 0,
  },
} as const;

export const authPrimaryButtonSx = {
  mt: 0.5,
  borderRadius: "10px",
  fontSize: "var(--font-size-body)",
  fontWeight: 600,
  boxShadow: "none",
  "&:hover": { boxShadow: "none" },
} as const;
