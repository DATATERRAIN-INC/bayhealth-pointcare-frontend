import { styled } from "@mui/material/styles";
import { Table } from "@mui/material";

export const TABLE_HEADER_COLOR = "#EEF5FC";

export const AppTable = styled(Table)({
  "& .MuiTableCell-root": {
    borderColor: "#E9EDF2",
    padding: "16px",
    fontSize: "var(--font-size-body)",
    color: "var(--foreground)",
  },
  "& .MuiTableHead-root .MuiTableCell-root": {
    backgroundColor: TABLE_HEADER_COLOR,
    color: "var(--foreground)",
    fontSize: "var(--font-size-body)",
    fontWeight: 650,
    letterSpacing: 0,
    textTransform: "none",
    whiteSpace: "nowrap",
  },
});
