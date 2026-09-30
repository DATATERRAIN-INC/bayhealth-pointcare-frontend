"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Skeleton,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Plus, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppTable } from "@/components/shared/AppTable";
import { TablePager } from "@/components/shared/TablePager";
import { useGetPatientsQuery } from "@/lib/api/patientsApi";
import { formatPatientDob } from "@/data/gapPatients";
import { parseCsv, rowsToPatients, summarizeUpload } from "@/lib/spreadsheet";

const PATIENTS_PER_PAGE = 10;

const searchSx = {
  width: { xs: "100%", sm: 300 },
  "& .MuiOutlinedInput-root": {
    height: "45px !important",
    minHeight: "45px !important",
    borderRadius: "7px",
    bgcolor: "#FFFFFF",
    "& fieldset": { borderColor: "#DDE2E9" },
    "&:hover fieldset": { borderColor: "#BFC7D2" },
    "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
  },
  "& .MuiOutlinedInput-input": { py: 0, fontSize: "var(--font-size-body)" },
} as const;

export function PatientsTableWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: patients = [], isLoading, isError, isFetching } = useGetPatientsQuery();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PATIENTS_PER_PAGE);
  const [importNotice, setImportNotice] = useState("");

  const filteredPatients = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter((patient) =>
      [patient.name, patient.address, patient.doctor, patient.source]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [patients, query]);

  const pagedPatients = useMemo(() => {
    const start = page * pageSize;
    return filteredPatients.slice(start, start + pageSize);
  }, [filteredPatients, page, pageSize]);

  async function handleImport(file: File) {
    const lower = file.name.toLowerCase();
    let rows: string[][];

    if (lower.endsWith(".csv")) {
      rows = parseCsv(await file.text());
    } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
        header: 1,
        raw: false,
        defval: "",
      });
      rows = grid.map((row) => row.map((cell) => String(cell ?? "").trim()));
    } else {
      setImportNotice(`${file.name} is not supported. Choose an .xlsx or .csv file.`);
      return;
    }

    const parsed = rowsToPatients(rows);
    setImportNotice(
      `${summarizeUpload(file.name, parsed)}. The file was validated; bulk upload is not connected yet.`
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E9EF",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.25}
        sx={{
          alignItems: { md: "center" },
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #E9EDF2",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 650, color: "text.primary" }}>
            Patient records
          </Typography>
          <Typography sx={{ mt: 0.2, fontSize: "var(--font-size-body)", color: "#8A93A3" }}>
            {isLoading || isFetching
              ? "Loading records…"
              : `${filteredPatients.length} patient${filteredPatients.length === 1 ? "" : "s"}`}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: { xs: "100%", md: "auto" }, alignItems: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search patients"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: <Search size={15} style={{ marginRight: 8, color: "#8B93A7" }} />,
              },
            }}
            sx={searchSx}
          />
          <Button
            type="button"
            variant="secondary"
            startIcon={<Upload size={15} />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ minWidth: 130, px: 2.25, whiteSpace: "nowrap" }}
          >
            Import
          </Button>
          <Button
            component={Link}
            href="/patients/add"
            startIcon={<Plus size={15} />}
            sx={{ minWidth: 155, px: 2.25, whiteSpace: "nowrap" }}
          >
            Add Patient
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,text/csv"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
              event.target.value = "";
            }}
          />
        </Stack>
      </Stack>

      {importNotice ? (
        <Alert
          severity="info"
          onClose={() => setImportNotice("")}
          sx={{ mx: 2, mt: 1.5, borderRadius: "7px", fontSize: "var(--font-size-body)" }}
        >
          {importNotice}
        </Alert>
      ) : null}

      <Box sx={{ overflowX: "auto" }}>
        <AppTable sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              {["Name", "Address", "Date of birth", "Doctor", "Source"].map((heading) => (
                <TableCell
                  key={heading}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {heading}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }, (_, rowIndex) => (
                <TableRow key={`patient-skeleton-${rowIndex}`}>
                  {[72, 92, 64, 76, 48].map((width, cellIndex) => (
                    <TableCell key={`patient-skeleton-${rowIndex}-${cellIndex}`}>
                      <Skeleton
                        variant="rounded"
                        animation="wave"
                        width={`${width}%`}
                        height={22}
                        sx={{ bgcolor: "#E9EEF4", borderRadius: "5px" }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ height: 180, textAlign: "center", color: "#D92D20" }}>
                  Could not load patients. Check the API connection and try again.
                </TableCell>
              </TableRow>
            ) : pagedPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ height: 180, textAlign: "center", color: "#8B93A7" }}>
                  No patients found.
                </TableCell>
              </TableRow>
            ) : (
              pagedPatients.map((patient) => (
                <TableRow
                  key={patient.id}
                  hover
                  sx={{ "&:hover td": { bgcolor: "#F8FAFC" } }}
                >
                  <TableCell sx={{ fontWeight: 600, color: "text.primary" }}>{patient.name}</TableCell>
                  <TableCell sx={{ color: "text.primary" }}>{patient.address}</TableCell>
                  <TableCell sx={{ color: "text.primary", whiteSpace: "nowrap" }}>
                    {formatPatientDob(patient.dateOfBirth)}
                  </TableCell>
                  <TableCell sx={{ color: "text.primary", whiteSpace: "nowrap" }}>
                    {patient.doctor}
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        px: 0.9,
                        py: 0.2,
                        borderRadius: "10px",
                        fontSize: "var(--font-size-body)",
                        fontWeight: 600,
                        color: patient.source === "Excel" ? "#1D5F9A" : "#526071",
                        bgcolor: patient.source === "Excel" ? "#EAF3FB" : "#F0F2F5",
                      }}
                    >
                      {patient.source}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </AppTable>
      </Box>

      {!isLoading && !isError ? (
        <TablePager
          page={page}
          pageSize={pageSize}
          rowCount={filteredPatients.length}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
    </Box>
  );
}
