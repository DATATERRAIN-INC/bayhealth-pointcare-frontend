import Image from "next/image";
import { Box, Typography } from "@mui/material";

const LOGO_INTRINSIC_WIDTH = 600;
const LOGO_INTRINSIC_HEIGHT = 160;

/** Display width used in the sidebar brand. */
export const BACH_LOGO_WIDTH = 160;

interface BachLogoProps {
  showTagline?: boolean;
  width?: number;
}

export function BachLogo({ showTagline = false, width = BACH_LOGO_WIDTH }: BachLogoProps) {
  const height = Math.round(width * (LOGO_INTRINSIC_HEIGHT / LOGO_INTRINSIC_WIDTH));

  return (
    <Box    style={{ marginLeft: 15 }}>
      <Image
        src="/bach-logo.webp"
        alt="Bay Area Community Health"
        width={LOGO_INTRINSIC_WIDTH}
        height={LOGO_INTRINSIC_HEIGHT}
        priority
        style={{ display: "block", width, height }}
      />
      {showTagline ? (
        <Typography
          sx={{
            mt: 0.5,
            fontSize: "var(--font-size-body)",
            fontWeight: 600,
            lineHeight: 1.2,
            color: "#2E9FD4",
          }}
        >
          Point of Care
        </Typography>
      ) : null}
    </Box>
  );
}
