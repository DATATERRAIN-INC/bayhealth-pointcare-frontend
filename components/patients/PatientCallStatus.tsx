"use client";

import { Box } from "@mui/material";
import { CallStatusChip } from "@/components/shared/CallStatusChip";
import { patientOutreachLabel, type PatientRecord } from "@/data/gapPatients";

/** Status chip; completed rows show Call #id / Text #id when available. */
export function PatientCallStatus({ patient }: { patient: PatientRecord }) {
  if (patient.callStatus === "completed") {
    const label = patientOutreachLabel(patient);
    if (label) {
      return (
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            px: 1,
            py: 0.3,
            borderRadius: "999px",
            bgcolor: "#E5F6EC",
            color: "#178A45",
            fontSize: "var(--font-size-body)",
            fontWeight: 650,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
          title="Completed"
        >
          {label}
        </Box>
      );
    }
  }

  return <CallStatusChip status={patient.callStatus} />;
}
