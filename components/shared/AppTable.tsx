import { styled } from "@mui/material/styles";
import { Table } from "@mui/material";

export const TABLE_HEADER_COLOR = "#EEF5FC";

/** Visible row count used for fixed DataGrid height across the app (independent of Rows per page). */
export const TABLE_VISIBLE_PAGE_ROWS = 10;
export const TABLE_HEADER_HEIGHT = 48;
export const TABLE_ROW_HEIGHT = 64;
export const TABLE_FOOTER_HEIGHT = 56;

/**
 * Fixed viewport height for DataGrid tables.
 * Always sized for {@link TABLE_VISIBLE_PAGE_ROWS} (10) so changing Rows per page does not grow the table.
 */
export function dataGridViewportHeight(options?: { withFooter?: boolean; rows?: number }) {
  const rows = options?.rows ?? TABLE_VISIBLE_PAGE_ROWS;
  const withFooter = options?.withFooter !== false;
  return TABLE_HEADER_HEIGHT + TABLE_ROW_HEIGHT * rows + (withFooter ? TABLE_FOOTER_HEIGHT : 0);
}

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
