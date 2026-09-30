import { isFutureDate, parseDobInput, toIsoDate } from "@/data/gapPatients";

export interface SpreadsheetRow {
  name: string;
  address: string;
  dateOfBirth: string;
  doctor: string;
}

export interface SkippedRow {
  row: number;
  reason: string;
}

export interface SpreadsheetParse {
  records: SpreadsheetRow[];
  skipped: SkippedRow[];
}

const HEADER_ALIASES: Record<string, keyof SpreadsheetRow | "dob"> = {
  name: "name",
  address: "address",
  dob: "dob",
  "date of birth": "dob",
  dateofbirth: "dob",
  doctor: "doctor",
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

export function rowsToPatients(rows: string[][]): SpreadsheetParse {
  if (rows.length === 0) {
    return { records: [], skipped: [{ row: 1, reason: "file is empty" }] };
  }

  const header = rows[0].map((value) => value.toLowerCase());
  const columns = header.map((value) => HEADER_ALIASES[value]);
  const records: SpreadsheetRow[] = [];
  const skipped: SkippedRow[] = [];

  rows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    const mapped: Partial<Record<"name" | "address" | "dob" | "doctor", string>> = {};
    columns.forEach((key, columnIndex) => {
      if (key !== "name" && key !== "address" && key !== "dob" && key !== "doctor") return;
      mapped[key] = cells[columnIndex]?.trim() ?? "";
    });

    if (!mapped.name) {
      skipped.push({ row: rowNumber, reason: "missing name" });
      return;
    }
    if (!mapped.dob) {
      skipped.push({ row: rowNumber, reason: "missing DOB" });
      return;
    }

    const dob = parseDobInput(mapped.dob);
    if (!dob) {
      skipped.push({ row: rowNumber, reason: "invalid DOB" });
      return;
    }
    if (isFutureDate(dob)) {
      skipped.push({ row: rowNumber, reason: "DOB is in the future" });
      return;
    }

    records.push({
      name: mapped.name,
      address: mapped.address ?? "",
      dateOfBirth: toIsoDate(dob),
      doctor: mapped.doctor || "Unassigned",
    });
  });

  return { records, skipped };
}

export function summarizeUpload(fileName: string, parsed: SpreadsheetParse): string {
  const added = parsed.records.length;
  const skipped = parsed.skipped.length;
  if (skipped === 0) {
    return `${fileName} — ${added} record${added === 1 ? "" : "s"} added`;
  }

  const first = parsed.skipped[0];
  const extra = skipped > 1 ? `, +${skipped - 1} more` : "";
  return `${fileName} — ${added} record${added === 1 ? "" : "s"} added, ${skipped} row${skipped === 1 ? "" : "s"} skipped (${first.reason}, row ${first.row}${extra})`;
}

export const patientTemplateCsv = [
  "Name,Address,DOB,Doctor",
  'Maria Santos,"14 Oak Street, Dover, DE 19901",03/12/1984,Dr. Alan Brooks',
  'James Patel,"8 River Road, Milford, DE 19963",11/02/1971,Dr. Alan Brooks',
].join("\n");
