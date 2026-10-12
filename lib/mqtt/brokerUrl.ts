/**
 * MQTT broker credentials (browser WebSocket).
 * Next.js only inlines NEXT_PUBLIC_* with static property access.
 * Spec: NEXT_PUBLIC_MQTT_URL / USERNAME / PASSWORD
 * Legacy CHAT_CLIENT_* kept as fallback.
 */

export function getMqttBrokerUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MQTT_URL ||
    process.env.NEXT_PUBLIC_CHAT_CLIENT_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
}

export function getMqttUsername(): string {
  return (
    process.env.NEXT_PUBLIC_MQTT_USERNAME ||
    process.env.NEXT_PUBLIC_CHAT_CLIENT_USERNAME ||
    ""
  ).trim();
}

/** Password may be plain or base64-encoded (CHAT_CLIENT style). */
export function getMqttPassword(): string {
  const raw = (
    process.env.NEXT_PUBLIC_MQTT_PASSWORD ||
    process.env.NEXT_PUBLIC_CHAT_CLIENT_PASSWORD ||
    ""
  ).trim();
  if (!raw) return "";
  try {
    const decoded = atob(raw);
    // Prefer decoded when it looks like a usable password string.
    if (decoded && !decoded.includes("\u0000")) return decoded;
  } catch {
    // not base64 — use raw
  }
  return raw;
}
