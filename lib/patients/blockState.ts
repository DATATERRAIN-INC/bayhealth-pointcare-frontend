const STORAGE_KEY = "pointcare_blocked_patient_ids";

export function readBlockedPatientIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as unknown;
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.map(String));
  } catch {
    return new Set();
  }
}

export function isPatientBlocked(id: string): boolean {
  return readBlockedPatientIds().has(id);
}

export function setPatientBlocked(id: string, blocked: boolean): void {
  if (typeof window === "undefined") return;
  const ids = readBlockedPatientIds();
  if (blocked) ids.add(id);
  else ids.delete(id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}
