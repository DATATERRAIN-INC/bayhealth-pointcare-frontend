"use client";

import { useEffect, useState, type MouseEventHandler } from "react";
import { Box, InputAdornment, TextField, useMediaQuery } from "@mui/material";
import { Search } from "lucide-react";

export type SearchBoxProps = {
  value?: string;
  handleSearch?: (value: string) => void;
  placeholder?: string;
  title?: string;
  iconPosition?: "start" | "end";
  height?: string;
  width?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  animatedItems?: string[];
  staticText?: string;
  animationInterval?: number;
  enableAnimation?: boolean;
};

export function SearchBox({
  placeholder = "Search here...",
  handleSearch = () => undefined,
  value = "",
  title = "",
  iconPosition = "start",
  height = "45px",
  width = "300px",
  onClick,
  animatedItems = [],
  staticText = "Search by ",
  animationInterval = 3000,
  enableAnimation = false,
}: SearchBoxProps) {
  const isSmallScreen = useMediaQuery("(max-width:765px)");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [focused, setFocused] = useState(false);

  const resolveTitle = isSmallScreen ? "Search" : title;
  const resolvePlaceholder = isSmallScreen ? "Search" : placeholder;
  const resolvedWidth = isSmallScreen ? "100%" : width;
  const showOverlay =
    enableAnimation &&
    !focused &&
    value === "" &&
    animatedItems.length > 0;
  const showPlaceholder = !focused && !showOverlay;

  useEffect(() => {
    if (!enableAnimation || focused || value !== "" || animatedItems.length === 0) {
      return;
    }
    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % animatedItems.length);
    }, animationInterval);
    return () => window.clearInterval(interval);
  }, [value, animatedItems.length, animationInterval, enableAnimation, focused]);

  return (
    <Box sx={{ position: "relative", width: resolvedWidth }}>
      <style>{`
        @keyframes searchBoxFadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(10px); }
        }
      `}</style>
      <TextField
        placeholder={showPlaceholder ? resolvePlaceholder : ""}
        title={resolveTitle || undefined}
        value={value}
        onChange={(event) => handleSearch(event.target.value)}
        onClick={onClick}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        variant="outlined"
        size="small"
        fullWidth
        slotProps={{
          input: {
            [iconPosition === "start" ? "startAdornment" : "endAdornment"]: (
              <InputAdornment position={iconPosition}>
                <Search size={15} color="#8B93A7" style={{ marginRight: iconPosition === "start" ? 0 : undefined }} />
              </InputAdornment>
            ),
            sx: {
              height: `${height} !important`,
              minHeight: `${height} !important`,
              py: 0,
            },
          },
        }}
        sx={{
          width: "100%",
          "& .MuiOutlinedInput-root": {
            height: `${height} !important`,
            minHeight: `${height} !important`,
            borderRadius: "7px",
            bgcolor: "#FFFFFF",
            "& fieldset": { borderColor: "#DDE2E9" },
            "&:hover fieldset": { borderColor: "#BFC7D2" },
            "&.Mui-focused fieldset": {
              borderColor: "primary.main",
              borderWidth: 1,
            },
          },
          "& .MuiOutlinedInput-input": {
            py: 0,
            fontSize: "var(--font-size-body)",
            color: "text.primary",
          },
          "& .MuiInputAdornment-root": {
            ml: iconPosition === "start" ? 0.5 : 0,
            mr: iconPosition === "end" ? 0.5 : 0,
          },
        }}
      />
      {showOverlay ? (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: iconPosition === "start" ? "40px" : "14px",
            right: iconPosition === "end" ? "40px" : "14px",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            color: "#8B93A7",
            fontSize: "var(--font-size-body)",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <Box component="span" sx={{ mr: "3px", flexShrink: 0 }}>
            {isSmallScreen ? "Search" : staticText}
          </Box>
          <Box
            component="span"
            key={currentIndex}
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 140,
              animation: `searchBoxFadeInOut ${animationInterval}ms ease-in-out infinite`,
            }}
          >
            {animatedItems[currentIndex]}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
