"use client";

import { Alert, Snackbar } from "@mui/material";
import { useEffect, useState } from "react";
import { subscribePermissionError } from "@/lib/permissionToast";

export function PermissionToast() {
  const [message, setMessage] = useState("");

  useEffect(() => subscribePermissionError(setMessage), []);

  return (
    <Snackbar
      open={Boolean(message)}
      autoHideDuration={4000}
      onClose={() => setMessage("")}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity="error" variant="filled" onClose={() => setMessage("")} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
