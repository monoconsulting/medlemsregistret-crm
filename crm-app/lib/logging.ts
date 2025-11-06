export type LogContext = Record<string, unknown> | undefined

export function logClientEvent(stage: string, context?: LogContext): void {
  try {
    const payload = JSON.stringify({ stage, context: context ?? null })
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json; charset=utf-8" })
      navigator.sendBeacon("/api/log.php", blob)
    } else {
      void fetch("/api/log.php", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        credentials: "include",
        body: payload,
      })
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("logClientEvent failed", error)
    }
  }
}
