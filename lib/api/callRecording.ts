import { getAuthToken } from "@/lib/auth";
import { getBaseUrl } from "@/lib/api/baseUrl";

const RECORDING_KEYS = [
  "recording_url",
  "recordingUrl",
  "call_recording_url",
  "recording_file_url",
  "recording",
] as const;

export function pickRecordingUrl(source: unknown): string {
  if (!source || typeof source !== "object") return "";
  const record = source as Record<string, unknown>;
  for (const key of RECORDING_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function recordingUrlFromResponse(response: unknown): string {
  const direct = pickRecordingUrl(response);
  if (direct) return direct;
  if (!response || typeof response !== "object") return "";
  const results = (response as { results?: unknown[] }).results;
  if (Array.isArray(results) && results.length > 0) {
    return pickRecordingUrl(results[0]);
  }
  return "";
}

/** Resolve relative API paths to an absolute URL for fetch / audio. */
export function resolveRecordingUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = getBaseUrl().replace(/\/+$/, "");
  if (trimmed.startsWith("/api/")) return `${base}${trimmed}`;
  const apiRoot = `${base}/api/ai-call`;
  return trimmed.startsWith("/") ? `${apiRoot}${trimmed}` : `${apiRoot}/${trimmed}`;
}

export function recordingNeedsAuthFetch(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (!/^https?:\/\//i.test(trimmed)) return true;
  const base = getBaseUrl().replace(/\/+$/, "");
  return trimmed.startsWith(base);
}

export async function fetchRecordingBlobUrl(url: string): Promise<string> {
  const fetchUrl = resolveRecordingUrl(url);
  const token = getAuthToken();
  const response = await fetch(fetchUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) {
    throw new Error(`Recording request failed (${response.status})`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
