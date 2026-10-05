import { Box, Stack, Typography } from "@mui/material";
import { Notifications } from "@/components/notifications/Notifications";

export default function NotificationsPage() {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: "text.primary", lineHeight: 1.25 }}>
          Notifications
        </Typography>
        <Typography sx={{ mt: 0.4, color: "text.secondary" }}>
          Review alerts and mark them as read.
        </Typography>
      </Box>
      <Notifications />
    </Stack>
  );
}
