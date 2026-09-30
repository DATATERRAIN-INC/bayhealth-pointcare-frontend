import { Box, Stack, Typography } from "@mui/material";
import { PatientsTableWorkspace } from "@/components/patients/PatientsTableWorkspace";

export default function PatientsPage() {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: "text.primary", lineHeight: 1.25 }}>
          Patients
        </Typography>
        <Typography sx={{ mt: 0.4, color: "text.secondary" }}>
          View, add, and manage patient records.
        </Typography>
      </Box>
      <PatientsTableWorkspace />
    </Stack>
  );
}
