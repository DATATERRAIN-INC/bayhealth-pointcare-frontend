import { Box, Stack, Typography } from "@mui/material";
import { Patient } from "@/components/patients/Patient";

export default function PatientsPage() {
  return (
    <Stack
      spacing={2}
      sx={{
        height: { xs: "calc(100dvh - 120px)", md: "calc(100dvh - 140px)" },
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: "text.primary", lineHeight: 1.25 }}>
          Patients
        </Typography>
        <Typography sx={{ mt: 0.4, color: "text.secondary" }}>
          View, add, and manage patient records.
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Patient />
      </Box>
    </Stack>
  );
}
