import { useAuth } from "../hooks/useAuth";
import {
  type ChallengeRecord,
  type SubmissionRecord,
} from "../lib/pocketbase";
import { formatDelta, formatSeconds } from "../lib/format";
import { resolveUsername, type PbUserRecord } from "../lib/users";

function posClass(index: number): string {
  if (index === 0) return "text-[#f5c842]";
  if (index === 1) return "text-[#a0a8b8]";
  if (index === 2) return "text-orange";
  return "text-muted";
}

function avStyle(index: number): { bg: string; color: string } {
  if (index === 0) return { bg: "#231b00", color: "#f5c842" };
  if (index === 1) return { bg: "#1a1a1a", color: "#a0a8b8" };
  if (index === 2) return { bg: "#1e0f06", color: "var(--color-orange)" };
  return { bg: "#1a1a1a", color: "#888" };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function LeaderboardPanel({
  challenge,
  submissions,
  subtitle = "este mês",
  limit = 3,
}: {
  challenge: ChallengeRecord;
  submissions: SubmissionRecord[];
  subtitle?: string;
  limit?: number;
}) {
  const { user } = useAuth();
  const headLabel =
    challenge.type === "exact_time"
      ? "Mais próximos do alvo"
      : "Mais rápidos";

  const items = submissions.slice(0, limit);

  if (items.length === 0) {
    return (
      <p className="rounded-[var(--radius)] border border-border bg-surface px-4 py-6 text-center text-sm text-muted2">
        Ainda sem submissões.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
        <span className="font-syne text-sm font-bold text-text">{headLabel}</span>
        <span className="text-[11px] text-muted2">{subtitle}</span>
      </div>
      {items.map((sub, index) => {
        const record = sub.expand?.user_id as PbUserRecord | undefined;
        const name = record ? resolveUsername(record) : "—";
        const isMe = user?.id === sub.user_id;
        const score =
          challenge.type === "exact_time"
            ? formatDelta(sub.delta_seconds ?? 0)
            : formatSeconds(sub.duration_seconds);
        const style = avStyle(index);
        const scoreColor =
          index === 0
            ? "text-accent"
            : index === 1
              ? "text-[#a0a8b8]"
              : index === 2
                ? "text-orange"
                : "text-accent";

        return (
          <div
            key={sub.id}
            className={`flex items-center gap-2.5 border-b border-border px-3.5 py-2.5 last:border-b-0 ${
              isMe ? "bg-accent-dim" : ""
            }`}
          >
            <span
              className={`w-[18px] text-center font-syne text-[13px] font-extrabold ${posClass(index)}`}
            >
              {index + 1}
            </span>
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-syne text-[11px] font-bold"
              style={{ background: style.bg, color: style.color }}
            >
              {initials(name)}
            </div>
            <div className="min-w-0 flex-1 text-[13px] text-text">
              {name}
              {isMe && (
                <>
                  {" "}
                  <span className="text-muted2">(tu)</span>
                  <small className="mt-0.5 block text-[11px] text-muted2">
                    melhor tentativa
                  </small>
                </>
              )}
            </div>
            <span className={`font-syne text-[13px] font-bold ${scoreColor}`}>
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
