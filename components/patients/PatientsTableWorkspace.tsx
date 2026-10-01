"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Plus, Search, Upload } from "lucide-react";
import { PatientActions } from "@/components/patients/PatientActions";
import { Button } from "@/components/ui/Button";
import { TABLE_HEADER_COLOR } from "@/components/shared/AppTable";
import { SuccessDialog } from "@/components/shared/SuccessDialog";
import { TablePager } from "@/components/shared/TablePager";
import { useGetPatientsQuery, useUploadPatientsMutation } from "@/lib/api/patientsApi";
import { formatPatientDob, formatPatientPhone, type PatientRecord } from "@/data/gapPatients";

const PATIENTS_PER_PAGE = 10;
const blockedReporter: { current: (message: string) => void } = { current: () => undefined };

function uploadMessage(data: unknown, fileName: string): string {
  if (data && typeof data === "object") {
    const record = data as { message?: unknown; detail?: unknown; created?: unknown; count?: unknown };
    if (typeof record.message === "string" && record.message.trim()) return record.message;
    if (typeof record.detail === "string" && record.detail.trim()) return record.detail;
    if (typeof record.created === "number") return `Imported ${record.created} patients from ${fileName}.`;
    if (typeof record.count === "number") return `Imported ${record.count} patients from ${fileName}.`;
  }
  return "Patients uploaded successfully.";
}

function uploadErrorMessage(error: unknown): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object") {
      const record = data as { detail?: unknown; message?: unknown };
      if (typeof record.detail === "string" && record.detail.trim()) return record.detail;
      if (typeof record.message === "string" && record.message.trim()) return record.message;
    }
  }
  if (typeof error === "object" && error && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") {
      return "Could not reach the upload service.";
    }
  }
  return "Could not import this file. Please try again.";
}

function BlockedChip() {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        px: 0.8,
        py: 0.15,
        borderRadius: "999px",
        fontSize: "var(--font-size-body)",
        fontWeight: 600,
        lineHeight: 1.4,
        color: "#D14343",
        bgcolor: "#FDECEC",
      }}
    >
      Blocked
    </Box>
  );
}

const columns: GridColDef<PatientRecord>[] = [
  {
    field: "actions",
    headerName: "Action",
    width: 88,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => (
      <PatientActions patient={params.row} onBlocked={(message) => blockedReporter.current(message)} />
    ),
  },
  {
    field: "name",
    headerName: "Name",
    flex: 1,
    minWidth: 140,
    renderCell: (params) => (
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
        <Typography
          noWrap
          sx={{ fontWeight: 600, fontSize: "var(--font-size-body)", color: params.row.blocked ? "#8B93A7" : "text.primary" }}
        >
          {params.row.name}
        </Typography>
        {params.row.blocked ? <BlockedChip /> : null}
      </Stack>
    ),
  },
  {
    field: "phoneNumber",
    headerName: "Phone",
    flex: 1,
    minWidth: 150,
    valueGetter: (_value, row) => formatPatientPhone(row.countryCode, row.phoneNumber),
    renderCell: (params) => (
      <Typography
        noWrap
        sx={{
          fontSize: "var(--font-size-body)",
          fontWeight: 550,
          color: params.row.blocked ? "#8B93A7" : "text.primary",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatPatientPhone(params.row.countryCode, params.row.phoneNumber)}
      </Typography>
    ),
  },
  {
    field: "address",
    headerName: "Address",
    flex: 1.2,
    minWidth: 160,
  },
  {
    field: "dateOfBirth",
    headerName: "Date of birth",
    flex: 1,
    minWidth: 140,
    valueFormatter: (value) => formatPatientDob(String(value ?? "")),
  },
  {
    field: "doctor",
    headerName: "Doctor",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "source",
    headerName: "Source",
    flex: 0.8,
    minWidth: 130,
    sortable: false,
    renderCell: (params) => (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          flexShrink: 0,
          px: 1.25,
          py: 0.35,
          borderRadius: "10px",
          fontSize: "var(--font-size-body)",
          fontWeight: 600,
          lineHeight: 1.4,
          color: params.row.source === "Excel" ? "#1D5F9A" : "#526071",
          bgcolor: params.row.source === "Excel" ? "#EAF3FB" : "#F0F2F5",
        }}
      >
        {params.row.source}
      </Box>
    ),
  },
];

const searchSx = {
  width: { xs: "100%", md: 300 },
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
  const isDesktopTable = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PATIENTS_PER_PAGE);
  const { data, isLoading, isError, isFetching } = useGetPatientsQuery({
    page: page + 1,
    pageSize,
    search: search || undefined,
  });
  const patients = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const [uploadPatients, { isLoading: isUploading }] = useUploadPatientsMutation();
  const [importError, setImportError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [blockSuccess, setBlockSuccess] = useState("");
  const closeUploadSuccess = useCallback(() => setUploadSuccess(null), []);
  const closeBlockSuccess = useCallback(() => setBlockSuccess(""), []);
  blockedReporter.current = setBlockSuccess;

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const stretchGrid = isLoading || isError || patients.length === 0;

  async function handleImport(file: File) {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls") && !lower.endsWith(".csv")) {
      setImportError(`${file.name} is not supported. Choose an .xlsx or .csv file.`);
      return;
    }

    setImportError(null);
    try {
      const result = await uploadPatients(file).unwrap();
      setUploadSuccess(uploadMessage(result, file.name));
      setPage(0);
    } catch (error) {
      setImportError(uploadErrorMessage(error));
    }
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
            {isLoading
              ? "Loading records…"
              : `${totalCount} patient${totalCount === 1 ? "" : "s"}`}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          sx={{ width: { xs: "100%", md: "auto" }, alignItems: { xs: "stretch", md: "center" } }}
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
            loading={isUploading}
            disabled={isUploading}
            sx={{
              width: { xs: "100%", md: "auto" },
              minWidth: { xs: "100%", md: 130 },
              alignSelf: { xs: "stretch", md: "auto" },
              px: 2.25,
              whiteSpace: "nowrap",
            }}
          >
            {isUploading ? "Importing…" : "Import"}
          </Button>
          <Button
            component={Link}
            href="/patients/add"
            startIcon={<Plus size={15} />}
            sx={{
              width: { xs: "100%", md: "auto" },
              minWidth: { xs: "100%", md: 155 },
              alignSelf: { xs: "stretch", md: "auto" },
              px: 2.25,
              whiteSpace: "nowrap",
            }}
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

      {importError ? (
        <Alert
          severity="error"
          onClose={() => setImportError(null)}
          sx={{ mx: 2, mt: 1.5, borderRadius: "7px", fontSize: "var(--font-size-body)" }}
        >
          {importError}
        </Alert>
      ) : null}

      <SuccessDialog
        open={Boolean(uploadSuccess)}
        message={uploadSuccess ?? "Patients uploaded successfully."}
        onClose={closeUploadSuccess}
      />
      <SuccessDialog
        open={Boolean(blockSuccess)}
        message={blockSuccess || "Patient blocked successfully."}
        onClose={closeBlockSuccess}
      />

      <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" }, p: 1.5 }}>
        {isLoading ? (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={`patient-card-skeleton-${index}`} variant="rounded" height={96} sx={{ bgcolor: "#E9EEF4", borderRadius: "12px" }} />
          ))
        ) : isError ? (
          <Typography sx={{ py: 4, textAlign: "center", color: "#D92D20", fontSize: "var(--font-size-body)" }}>
            Could not load patients. Check the API connection and try again.
          </Typography>
        ) : patients.length === 0 ? (
          <Typography sx={{ py: 4, textAlign: "center", color: "#8B93A7", fontSize: "var(--font-size-body)" }}>
            No patients found.
          </Typography>
        ) : (
          patients.map((patient) => (
            <Box
              key={patient.id}
              sx={{
                border: "1px solid #E6EAF0",
                borderRadius: "12px",
                px: 1.75,
                py: 1.6,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Typography sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.3 }}>{patient.name}</Typography>
                    {patient.blocked ? <BlockedChip /> : null}
                  </Stack>
                </Box>
                <PatientActions patient={patient} onBlocked={setBlockSuccess} />
              </Stack>
              <Typography
                sx={{
                  mt: 0.55,
                  fontSize: "var(--font-size-body)",
                  fontWeight: 600,
                  color: "text.primary",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatPatientPhone(patient.countryCode, patient.phoneNumber)}
              </Typography>
              <Typography sx={{ mt: 0.45, fontSize: "var(--font-size-body)", color: "#5C6478", lineHeight: 1.4 }}>
                {patient.address}
              </Typography>
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  mt: 0.7,
                  px: 0.9,
                  py: 0.2,
                  borderRadius: "999px",
                  fontSize: "var(--font-size-body)",
                  fontWeight: 600,
                  color: patient.source === "Excel" ? "#1D5F9A" : "#526071",
                  bgcolor: patient.source === "Excel" ? "#EAF3FB" : "#F0F2F5",
                }}
              >
                {patient.source}
              </Box>
              <Typography sx={{ mt: 0.45, fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
                {formatPatientDob(patient.dateOfBirth)} · {patient.doctor}
              </Typography>
            </Box>
          ))
        )}
      </Stack>

      {isDesktopTable ? (
      <Box
        sx={{
          width: "100%",
          height: stretchGrid ? 320 : "auto",
        }}
      >
        <DataGrid
          rows={isError ? [] : patients}
          columns={columns}
          loading={isLoading || isFetching}
          autoHeight={!stretchGrid}
          pagination
          paginationMode="server"
          rowCount={totalCount}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          rowHeight={64}
          columnHeaderHeight={48}
          slots={{
            noRowsOverlay: () => (
              <Stack sx={{ height: "100%", alignItems: "center", justifyContent: "center", px: 2 }}>
                <Typography sx={{ fontSize: "var(--font-size-body)", color: isError ? "#D92D20" : "#8B93A7", textAlign: "center" }}>
                  {isError ? "Could not load patients. Check the API connection and try again." : "No patients found."}
                </Typography>
              </Stack>
            ),
          }}
          sx={{
            border: 0,
            width: "100%",
            height: stretchGrid ? "100%" : "auto",
            fontSize: "var(--font-size-body)",
            ...(!stretchGrid
              ? {
                  "& .MuiDataGrid-virtualScroller": { overflowY: "hidden" },
                  "& .MuiDataGrid-scrollbar--vertical": { display: "none" },
                }
              : {}),
            "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
              bgcolor: TABLE_HEADER_COLOR,
            },
            "& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell": {
              px: 2,
            },
            "& .MuiDataGrid-columnHeader[data-field='source'], & .MuiDataGrid-cell[data-field='source']": {
              pr: 2.5,
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 650,
              fontSize: "var(--font-size-body)",
              color: "text.primary",
            },
            "& .MuiDataGrid-cell": {
              borderColor: "#E9EDF2",
              display: "flex",
              alignItems: "center",
              fontSize: "var(--font-size-body)",
              color: "text.primary",
            },
            "& .MuiDataGrid-row:hover": {
              bgcolor: "#F8FAFC",
            },
            "& .MuiDataGrid-footerContainer": {
              borderColor: "#EEF0F4",
            },
          }}
        />
      </Box>
      ) : null}

      {!isLoading && !isError ? (
        <Box sx={{ display: { xs: "block", md: "none" } }}>
        <TablePager
          page={page}
          pageSize={pageSize}
          rowCount={totalCount}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
        </Box>
      ) : null}
    </Box>
  );
}
