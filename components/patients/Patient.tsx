"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Dialog,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Ban, Eye, FileText, MessageSquare, Phone, Plus, Search, ShieldCheck, Upload } from "lucide-react";
import {
  actionErrorMessage,
  CallInitiatingDialog,
  ViewPatientDialog,
} from "@/components/patients/ViewPatientDialog";
import { PatientTranscriptDialog } from "@/components/patients/PatientTranscriptDialog";
import { CallStatusChip } from "@/components/shared/CallStatusChip";
import { RecordActions, type ActionsMenuItem } from "@/components/shared/RecordActions";
import { Button } from "@/components/ui/Button";
import { TABLE_HEADER_COLOR } from "@/components/shared/AppTable";
import { SuccessDialog } from "@/components/shared/SuccessDialog";
import { TablePager } from "@/components/shared/TablePager";
import { useStartOutboundCallMutation } from "@/lib/api/callsApi";
import { useStartOutboundSmsMutation } from "@/lib/api/smsApi";
import {
  useGetPatientsQuery,
  useSetPatientBlockedStatusMutation,
  useUploadPatientsMutation,
} from "@/lib/api/patientsApi";
import { formatPatientDob, formatPatientPhone, type PatientRecord } from "@/data/gapPatients";
import { getApiErrorMessage } from "@/lib/apiError";
import { elevation } from "@/lib/theme/tokens";

const PATIENTS_PER_PAGE = 10;

type CallUiPhase = "idle" | "calling" | "success";

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
  return getApiErrorMessage(error, "Could not import this file. Please try again.");
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

function PatientRowActions({
  patient,
  onNotify,
  onViewDetail,
}: {
  patient: PatientRecord;
  onNotify: (message: string) => void;
  onViewDetail: (patient: PatientRecord) => void;
}) {
  const [setBlocked, { isLoading: isBlocking }] = useSetPatientBlockedStatusMutation();
  const [startOutboundCall] = useStartOutboundCallMutation();
  const [startOutboundSms, { isLoading: isSendingSms }] = useStartOutboundSmsMutation();
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [callPhase, setCallPhase] = useState<CallUiPhase>("idle");

  async function toggleBlocked() {
    const blocking = !patient.blocked;
    setActionError("");
    try {
      await setBlocked({ id: patient.id, is_blocked: blocking }).unwrap();
      onNotify(blocking ? "Patient blocked successfully." : "Patient unblocked successfully.");
    } catch (error) {
      setActionError(actionErrorMessage(error, "Could not update this patient. Please try again."));
    }
  }

  async function runOutboundCall() {
    setActionError("");
    setCallPhase("calling");
    const startedAt = Date.now();
    const minLoaderMs = 1200;
    try {
      await startOutboundCall({ id: patient.id }).unwrap();
      const wait = Math.max(0, minLoaderMs - (Date.now() - startedAt));
      if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
      setCallPhase("success");
    } catch (error) {
      const wait = Math.max(0, 700 - (Date.now() - startedAt));
      if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
      setCallPhase("idle");
      setActionError(actionErrorMessage(error, "Could not start the outbound call. Please try again."));
    }
  }

  async function runOutboundSms() {
    setActionError("");
    try {
      await startOutboundSms({ id: patient.id }).unwrap();
      onNotify("Outbound text sent successfully.");
    } catch (error) {
      setActionError(actionErrorMessage(error, "Could not send the outbound text. Please try again."));
    }
  }

  const items: ActionsMenuItem[] = [
    {
      key: "view",
      label: "View detail",
      icon: <Eye size={16} />,
      onClick: () => onViewDetail(patient),
    },
    {
      key: "call",
      label: "Call",
      icon: <Phone size={16} />,
      disabled: callPhase !== "idle" || patient.blocked,
      onClick: () => {
        void runOutboundCall();
      },
    },
    {
      key: "text",
      label: "Text",
      icon: <MessageSquare size={16} />,
      disabled: isSendingSms || patient.blocked,
      onClick: () => {
        void runOutboundSms();
      },
    },
    ...(patient.callStatus === "completed"
      ? [
          {
            key: "transcript",
            label: "Transcript",
            icon: <FileText size={16} />,
            onClick: () => setTranscriptOpen(true),
          } satisfies ActionsMenuItem,
        ]
      : []),
    {
      key: "block",
      label: patient.blocked ? "Unblock" : "Block",
      icon: patient.blocked ? <ShieldCheck size={16} /> : <Ban size={16} />,
      disabled: isBlocking,
      color: patient.blocked ? "primary.main" : "#D14343",
      onClick: () => {
        void toggleBlocked();
      },
    },
  ];

  return (
    <RecordActions name={patient.name} items={items}>
      <PatientTranscriptDialog
        patient={patient}
        open={transcriptOpen}
        onClose={() => setTranscriptOpen(false)}
      />
      {callPhase !== "idle" ? (
        <CallInitiatingDialog
          open
          phase={callPhase}
          patient={patient}
          onSuccessDone={() => setCallPhase("idle")}
        />
      ) : null}
      <Dialog
        open={Boolean(actionError)}
        onClose={() => setActionError("")}
        maxWidth={false}
        slotProps={{
          backdrop: { sx: { bgcolor: elevation.backdrop } },
          paper: {
            sx: {
              width: 420,
              maxWidth: "calc(100vw - 32px)",
              borderRadius: "12px",
              p: 3,
              boxShadow: elevation.floating,
            },
          },
        }}
      >
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#D92D20" }}>{actionError}</Typography>
        <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 2 }}>
          <Button onClick={() => setActionError("")} sx={{ px: 2 }}>
            Close
          </Button>
        </Stack>
      </Dialog>
    </RecordActions>
  );
}

function buildPatientColumns(
  onNotify: (message: string) => void,
  onViewDetail: (patient: PatientRecord) => void,
): GridColDef<PatientRecord>[] {
  return [
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
        <PatientRowActions patient={params.row} onNotify={onNotify} onViewDetail={onViewDetail} />
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
            component="button"
            type="button"
            noWrap
            onClick={() => onViewDetail(params.row)}
            sx={{
              p: 0,
              border: 0,
              bgcolor: "transparent",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: "var(--font-size-body)",
              color: params.row.blocked ? "#8B93A7" : "primary.main",
              cursor: "pointer",
              textAlign: "left",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              "&:hover": { color: params.row.blocked ? "#667085" : "#1C4E8A" },
            }}
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
      field: "callStatus",
      headerName: "Status",
      flex: 0.9,
      minWidth: 140,
      sortable: false,
      renderCell: (params) => <CallStatusChip status={params.row.callStatus} />,
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
}

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

export function Patient() {
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
  const [detailPatient, setDetailPatient] = useState<PatientRecord | null>(null);
  const closeUploadSuccess = useCallback(() => setUploadSuccess(null), []);
  const closeBlockSuccess = useCallback(() => setBlockSuccess(""), []);
  const onActionNotify = useCallback((message: string) => setBlockSuccess(message), []);
  const onViewDetail = useCallback((patient: PatientRecord) => setDetailPatient(patient), []);
  const columns = useMemo(
    () => buildPatientColumns(onActionNotify, onViewDetail),
    [onActionNotify, onViewDetail],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

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
        boxShadow: elevation.floatingPanel,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
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
          flexShrink: 0,
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
            variant="soft"
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
          sx={{ mx: 2, mt: 1.5, flexShrink: 0, borderRadius: "7px", fontSize: "var(--font-size-body)" }}
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
      <ViewPatientDialog
        patient={detailPatient}
        open={Boolean(detailPatient)}
        onClose={() => setDetailPatient(null)}
      />

      <Stack spacing={1.25} sx={{ display: { xs: "flex", md: "none" }, flex: 1, minHeight: 0, overflowY: "auto", p: 1.5 }}>
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
                flexShrink: 0,
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    <Typography
                      component="button"
                      type="button"
                      onClick={() => onViewDetail(patient)}
                      sx={{
                        p: 0,
                        border: 0,
                        bgcolor: "transparent",
                        fontFamily: "inherit",
                        fontWeight: 700,
                        color: "primary.main",
                        lineHeight: 1.3,
                        cursor: "pointer",
                        textAlign: "left",
                        textDecoration: "underline",
                        textUnderlineOffset: "2px",
                      }}
                    >
                      {patient.name}
                    </Typography>
                    {patient.blocked ? <BlockedChip /> : null}
                  </Stack>
                </Box>
                <PatientRowActions
                  patient={patient}
                  onNotify={setBlockSuccess}
                  onViewDetail={onViewDetail}
                />
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
              <Stack direction="row" spacing={0.75} sx={{ mt: 0.7, alignItems: "center", flexWrap: "wrap" }}>
                <CallStatusChip status={patient.callStatus} />
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
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
              </Stack>
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
            flex: 1,
            minHeight: 0,
          }}
        >
          <DataGrid
            rows={isError ? [] : patients}
            columns={columns}
            loading={isLoading || isFetching}
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
              height: "100%",
              fontSize: "var(--font-size-body)",
              "& .MuiDataGrid-main": { minHeight: 0 },
              "& .MuiDataGrid-virtualScroller": { overflowY: "auto" },
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
        <Box sx={{ display: { xs: "block", md: "none" }, flexShrink: 0 }}>
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
