import type { ChallengeType } from "./pocketbase";

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "short",
  });
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

const AVATAR_PALETTES = [
  { bg: "#231b00", color: "#f5c842" },
  { bg: "#1a1a2e", color: "#4da6ff" },
  { bg: "#1e0f06", color: "#ff6b2b" },
  { bg: "#1a1a1a", color: "#a0a8b8" },
  { bg: "#0f1a12", color: "#6bcf7f" },
] as const;

export function avatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % 9973;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

export function rankPosClass(index: number): string {
  if (index === 0) return "text-[#f5c842]";
  if (index === 1) return "text-[#a0a8b8]";
  if (index === 2) return "text-orange";
  return "text-muted";
}

export function scoreTone(
  type: ChallengeType,
  deltaSeconds?: number,
): "good" | "ok" {
  if (type === "exact_time") {
    const d = deltaSeconds ?? 99;
    return d <= 0.15 ? "good" : "ok";
  }
  return "ok";
}
