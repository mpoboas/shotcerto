export function formatSeconds(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(decimals)}s`;
}

export function formatSecondsShort(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}s`;
}

export function formatDelta(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `Δ ${value.toFixed(2)}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function challengeTypeLabel(type: "exact_time" | "speed_run"): string {
  return type === "exact_time" ? "Tempo exato" : "Mais rápido";
}

export function challengeBadgeClass(type: "exact_time" | "speed_run"): string {
  return type === "exact_time"
    ? "bg-blue-dim text-blue border border-blue/20"
    : "bg-orange-dim text-orange border border-orange/20";
}

export function challengeThumbClass(type: "exact_time" | "speed_run"): string {
  return type === "exact_time" ? "bg-[#0a1520]" : "bg-[#180d06]";
}

export function challengeGlowClass(type: "exact_time" | "speed_run"): string {
  return type === "exact_time"
    ? "bg-[radial-gradient(circle,rgba(77,166,255,0.2)_0%,transparent_70%)]"
    : "bg-[radial-gradient(circle,rgba(255,107,43,0.2)_0%,transparent_70%)]";
}
