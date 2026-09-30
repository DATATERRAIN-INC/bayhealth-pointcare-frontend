const EVENT = "pointcare:forbidden";

export function showPermissionError(message = "You do not have permission to do that."): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

export function subscribePermissionError(listener: (message: string) => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<string>).detail;
    listener(typeof detail === "string" && detail.trim() ? detail : "You do not have permission to do that.");
  };
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
