"use client";

import { useState } from "react";
import {
  Box,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Button } from "@/components/ui/Button";
import { AppTable } from "@/components/shared/AppTable";
import { TablePager } from "@/components/shared/TablePager";
import { statusMeta, type OutreachCall, type OutreachStatus } from "@/data/gapCalls";
import { useGetCallTranscriptQuery, useGetCallsQuery } from "@/lib/api/callsApi";

type FilterKey = "all" | OutreachStatus;

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "in_progress", label: "In progress" },
  { key: "not_attended", label: "Not attended" },
];

const surface = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E8EAEE",
  borderRadius: "12px",
} as const;

function StatusLabel({ status }: { status: OutreachStatus }) {
  const meta = statusMeta[status];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        color: meta.color,
        fontSize: "var(--font-size-body)",
        fontWeight: 500,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      <Box
        component="span"
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: meta.color,
          flexShrink: 0,
        }}
      />
      {meta.label}
    </Box>
  );
}

function transcriptText(call: OutreachCall): string {
  return call.messages
    .map((line) => (line.time ? `${line.speaker} · ${line.time}\n${line.text}` : `${line.speaker}\n${line.text}`))
    .join("\n\n");
}

function copyWithTextarea(value: string) {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.focus();
  area.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(area);
  if (!copied) {
    throw new Error("Copy failed");
  }
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText && document.hasFocus()) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Clipboard can reject when the document is not focused.
    }
  }
  copyWithTextarea(value);
}

function TranscriptBody({
  call,
  loading = false,
  error = false,
}: {
  call: OutreachCall;
  loading?: boolean;
  error?: boolean;
}) {
  if (call.messages.length === 0) {
    const message = loading
      ? "Loading transcript…"
      : error
        ? "Could not load this transcript."
        : call.status === "in_progress"
          ? "Transcript available after the call ends."
          : "No transcript for this call.";
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 160,
          px: 2,
        }}
      >
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", textAlign: "center" }}>
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={1.75}>
      {call.messages.map((line, index) => {
        const fromPatient = line.speaker === "Patient";
        return (
          <Box
            key={`${index}-${line.speaker}`}
            sx={{ alignSelf: fromPatient ? "flex-end" : "flex-start", maxWidth: "90%" }}
          >
            <Typography
              sx={{
                mb: 0.5,
                fontSize: "var(--font-size-body)",
                fontWeight: 500,
                color: "#8B93A7",
                textAlign: fromPatient ? "right" : "left",
              }}
            >
              {line.time ? `${line.speaker} · ${line.time}` : line.speaker}
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 1.15,
                borderRadius: "10px",
                bgcolor: fromPatient ? "#F3F4F6" : "#EAF3FB",
                color: "text.primary",
                fontSize: "var(--font-size-body)",
                lineHeight: 1.45,
              }}
            >
              {line.text}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function CallFilterTabs({
  value,
  onChange,
}: {
  value: FilterKey;
  onChange: (next: FilterKey) => void;
}) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: FilterKey) => onChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 48,
        px: 1,
        borderBottom: "1px solid #E9EDF2",
        bgcolor: "#FFFFFF",
        "& .MuiTabs-indicator": {
          height: 2,
          bgcolor: "primary.main",
        },
        "& .MuiTab-root": {
          minHeight: 48,
          minWidth: "auto",
          px: 1.75,
          py: 0,
          textTransform: "none",
          fontSize: "var(--font-size-body)",
          fontWeight: 500,
          color: "#8B93A7",
          "&.Mui-selected": {
            color: "text.primary",
            fontWeight: 600,
          },
        },
      }}
    >
      {filters.map((item) => (
        <Tab key={item.key} value={item.key} disableRipple label={item.label} />
      ))}
    </Tabs>
  );
}

const CALLS_PER_PAGE = 10;

export function CallsWorkspace() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState("");
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CALLS_PER_PAGE);
  const { data, isLoading, isError } = useGetCallsQuery({
    page: page + 1,
    pageSize,
    status: filter === "all" ? undefined : filter,
  });

  const paged = data?.results ?? [];
  const rowCount = data?.count ?? 0;
  const selected = paged.find((call) => call.id === selectedId) ?? paged[0];
  const mobileCall = paged.find((call) => call.id === mobileOpenId);
  const transcriptCall = mobileCall?.retellCallId ? mobileCall : selected?.retellCallId ? selected : undefined;
  const {
    data: transcriptLines = [],
    isLoading: transcriptLoading,
    isError: transcriptError,
  } = useGetCallTranscriptQuery(transcriptCall?.retellCallId ?? "", {
    skip: !transcriptCall?.hasTranscript || !transcriptCall.retellCallId,
  });

  function withTranscript(call: OutreachCall | undefined): OutreachCall | undefined {
    if (!call || call.retellCallId !== transcriptCall?.retellCallId) return call;
    return {
      ...call,
      messages: transcriptLines,
      messageCount: transcriptLines.length || call.messageCount,
    };
  }

  const viewed = withTranscript(selected);

  async function copyTranscript() {
    if (!viewed || viewed.messages.length === 0) return;
    try {
      await copyText(transcriptText(viewed));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function transcriptLabel(call: OutreachCall): string {
    const available = call.hasTranscript || call.messages.length > 0;
    if (call.id === selected?.id && available) return "Viewing";
    if (available) return "View";
    if (call.status === "in_progress") return "After call ends";
    return "No transcript";
  }

  function emptyMessage() {
    if (isError) return "Could not load calls. Check the API connection and try again.";
    if (filter === "all") return "No calls yet.";
    return "No calls in this status.";
  }

  function skeletonRows() {
    return Array.from({ length: 5 }, (_, rowIndex) => (
      <TableRow key={`call-skeleton-${rowIndex}`}>
        {[72, 64, 48, 40, 56].map((width, cellIndex) => (
          <TableCell key={`call-skeleton-${rowIndex}-${cellIndex}`}>
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
    ));
  }

  function emptyRow(colSpan: number) {
    return (
      <TableRow>
        <TableCell
          colSpan={colSpan}
          sx={{
            py: "40px !important",
            color: isError ? "#D92D20" : "#8B93A7",
            textAlign: "center",
          }}
        >
          {emptyMessage()}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography
          sx={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "text.primary",
            lineHeight: 1.2,
          }}
        >
          Calls and transcripts
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: "var(--font-size-body)", color: "#6B7280", lineHeight: 1.45 }}>
          Track each outreach call. Transcripts appear when a call is complete. Times in America/New_York (EDT).
        </Typography>
      </Box>

      <Box
        sx={{
          display: { xs: "none", lg: "grid" },
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 0.9fr)",
          gap: 2,
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            ...surface,
            overflow: "hidden",
            minHeight: 440,
            borderColor: "#E5E9EF",
            borderRadius: "10px",
          }}
        >
          <CallFilterTabs
            value={filter}
            onChange={(next) => {
              setFilter(next);
              setPage(0);
            }}
          />

          <Box sx={{ overflowX: "auto" }}>
            <AppTable
              sx={{
                width: "100%",
                tableLayout: "fixed",
              }}
            >
              <TableHead>
                <TableRow>
                  {["Patient", "Status", "Started", "Duration", "Transcript"].map((heading) => (
                    <TableCell key={heading}>
                      {heading}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading
                  ? skeletonRows()
                  : paged.length === 0
                  ? emptyRow(5)
                  : paged.map((call) => {
                  const active = call.id === selected?.id;
                  const label = transcriptLabel(call);
                  const isLink = label === "Viewing" || label === "View";
                  return (
                    <TableRow
                      key={call.id}
                      hover
                      onClick={() => setSelectedId(call.id)}
                      sx={{
                        cursor: "pointer",
                        bgcolor: active ? "#F3F8FD" : "transparent",
                        boxShadow: active ? "inset 3px 0 0 #2F72B9" : "none",
                        "&:last-child td": { borderBottom: 0 },
                        "&:hover td": { bgcolor: active ? "#F3F8FD" : "#F8FAFC" },
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: "text.primary", fontSize: "var(--font-size-body)" }}>
                          {call.patientName}
                        </Typography>
                        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", mt: 0.15 }}>
                          Call #{call.callNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusLabel status={call.status} />
                      </TableCell>
                      <TableCell sx={{ color: "text.primary", whiteSpace: "nowrap" }}>{call.started}</TableCell>
                      <TableCell sx={{ color: "text.primary", whiteSpace: "nowrap" }}>{call.duration}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: "var(--font-size-body)",
                            fontWeight: isLink ? 600 : 500,
                            color: isLink ? "primary.main" : "#8B93A7",
                          }}
                        >
                          {label}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </AppTable>
          </Box>
          {rowCount > 0 ? (
            <TablePager
              page={page}
              pageSize={pageSize}
              rowCount={rowCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </Box>

        <TranscriptPanel
          call={viewed}
          loading={transcriptLoading && viewed?.retellCallId === transcriptCall?.retellCallId}
          error={transcriptError}
          copied={copied}
          onCopy={() => void copyTranscript()}
        />
      </Box>

      <Box
        sx={{
          display: { xs: "block", lg: "none" },
          ...surface,
          overflow: "hidden",
          borderColor: "#E5E9EF",
          borderRadius: "10px",
        }}
      >
        <CallFilterTabs
          value={filter}
          onChange={(next) => {
            setFilter(next);
            setPage(0);
          }}
        />
        {isLoading ? (
          <Stack spacing={1.5} sx={{ px: 2, py: 2 }}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={`call-mobile-skeleton-${index}`} variant="rounded" height={64} sx={{ bgcolor: "#E9EEF4" }} />
            ))}
          </Stack>
        ) : paged.length === 0 ? (
          <Box sx={{ px: 2, py: 5, textAlign: "center" }}>
            <Typography sx={{ fontSize: "var(--font-size-body)", color: isError ? "#D92D20" : "#8B93A7" }}>
              {emptyMessage()}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0} sx={{ "& > *:not(:last-child)": { borderBottom: "1px solid #F0F2F5" } }}>
            {paged.map((call) => {
            const open = mobileOpenId === call.id;
            return (
              <Box key={call.id} sx={{ px: 2, py: 1.75 }}>
                <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: "text.primary" }}>{call.patientName}</Typography>
                    <Typography sx={{ mt: 0.3, fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
                      Call #{call.callNumber} · {call.started} EDT ·{" "}
                      {call.status === "in_progress" ? "live" : call.duration}
                    </Typography>
                  </Box>
                  <StatusLabel status={call.status} />
                </Stack>

                <Box sx={{ mt: 1.15 }}>
                  {call.hasTranscript || call.messages.length > 0 ? (
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setMobileOpenId(open ? null : call.id)}
                      sx={{
                        p: 0,
                        border: 0,
                        bgcolor: "transparent",
                        color: "primary.main",
                        fontWeight: 600,
                        fontSize: "var(--font-size-body)",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {open ? "Hide transcript" : "View transcript"}
                    </Box>
                  ) : (
                    <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
                      {call.status === "in_progress"
                        ? "Transcript available after the call ends."
                        : "No transcript"}
                    </Typography>
                  )}

                  {open ? (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #F0F2F5" }}>
                      <TranscriptBody
                        call={withTranscript(call) ?? call}
                        loading={transcriptLoading && call.retellCallId === transcriptCall?.retellCallId}
                        error={transcriptError && call.retellCallId === transcriptCall?.retellCallId}
                      />
                    </Box>
                  ) : null}
                </Box>
              </Box>
            );
          })}
          </Stack>
        )}
        {rowCount > 0 ? (
          <TablePager
            page={page}
            pageSize={pageSize}
            rowCount={rowCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </Box>
    </Stack>
  );
}

function TranscriptPanel({
  call,
  loading = false,
  error = false,
  copied,
  onCopy,
}: {
  call: OutreachCall | undefined;
  loading?: boolean;
  error?: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  if (!call) {
    return (
      <Box
        sx={{
          ...surface,
          minHeight: 440,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2.25, pt: 2, pb: 1.75, borderBottom: "1px solid #F0F2F5" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary", letterSpacing: "-0.01em" }}>
            Transcript
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 2.25,
            py: 2,
          }}
        >
          <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7", textAlign: "center" }}>
            Select a call to view its transcript.
          </Typography>
        </Box>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.25,
            py: 1.5,
            borderTop: "1px solid #F0F2F5",
            bgcolor: "#FAFBFC",
          }}
        >
          <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7" }}>No call selected</Typography>
          <Button variant="secondary" size="sm" disabled sx={{ px: 1.75 }}>
            Copy transcript
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...surface,
        minHeight: 440,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 1,
          px: 2.25,
          pt: 2,
          pb: 1.75,
          borderBottom: "1px solid #F0F2F5",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 650, color: "text.primary", letterSpacing: "-0.01em" }}>
            Transcript · {call.patientName}
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: "var(--font-size-body)", color: "#8B93A7", lineHeight: 1.4 }}>
            Call #{call.callNumber} · {call.dateLabel} · {call.windowLabel}
            {call.hasTranscript || call.messages.length > 0 ? ` · ${call.duration}` : ""}
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <StatusLabel status={call.status} />
        </Box>
      </Stack>

      <Box sx={{ flex: 1, maxHeight: 520, overflowY: "auto", px: 2.25, py: 2 }}>
        <TranscriptBody call={call} loading={loading} error={error} />
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.25,
          py: 1.5,
          borderTop: "1px solid #F0F2F5",
          bgcolor: "#FAFBFC",
        }}
      >
        <Typography sx={{ fontSize: "var(--font-size-body)", color: "#8B93A7" }}>
          {call.messages.length > 0
            ? `End of transcript · ${call.messages.length} messages`
            : loading
              ? "Loading transcript…"
              : "Transcript pending"}
        </Typography>
        <Button
          variant="secondary"
          size="sm"
          disabled={call.messages.length === 0}
          onClick={onCopy}
          sx={{ px: 1.75 }}
        >
          {copied ? "Copied" : "Copy transcript"}
        </Button>
      </Stack>
    </Box>
  );
}
