import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { formatChallengeSummary } from "../lib/challenges";
import {
  avatarPalette,
  rankPosClass,
  userInitials,
} from "../lib/feedHelpers";
import { formatDelta, formatSeconds } from "../lib/format";
import { buildModeSlug, modeKeyFromChallenge } from "../lib/modes";
import { listSubmissionsForChallenge } from "../lib/queries";
import type { ChallengeRecord, SubmissionRecord } from "../lib/pocketbase";
import { resolveUsername, type PbUserRecord } from "../lib/users";

export function FeedPostRank({
  challenge,
  highlightUserId,
}: {
  challenge: ChallengeRecord;
  highlightUserId?: string;
}) {
  const { user } = useAuth();
  const [rows, setRows] = useState<SubmissionRecord[] | null>(null);
  const modeSlug = buildModeSlug(modeKeyFromChallenge(challenge));
  const title = formatChallengeSummary(challenge);
  const rankEmoji = challenge.type === "exact_time" ? "🏆" : "⚡";

  useEffect(() => {
    let active = true;
    listSubmissionsForChallenge(challenge, { limit: 3, expandUser: true })
      .then((items) => {
        if (active) setRows(items);
      })
      .catch(() => {
        if (active) setRows([]);
      });
    return () => {
      active = false;
    };
  }, [challenge.id]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="mx-3.5 mb-2.5 overflow-hidden rounded-[10px] border border-border bg-white/[0.03]">
      <Link
        to={`/ranking?mode=${encodeURIComponent(modeSlug)}`}
        className="block border-b border-border px-3 py-1.5 font-syne text-[10px] font-bold uppercase tracking-wider text-muted2 hover:text-text"
      >
        {rankEmoji} Ranking — {title}
      </Link>
      {rows.map((sub, index) => {
        const record = sub.expand?.user_id as PbUserRecord | undefined;
        const name = record ? resolveUsername(record) : "—";
        const isHighlight =
          sub.user_id === highlightUserId || sub.user_id === user?.id;
        const palette = avatarPalette(name);
        const score =
          challenge.type === "exact_time"
            ? formatDelta(sub.delta_seconds ?? 0)
            : formatSeconds(sub.duration_seconds);
        const isLeader = index === 0;

        return (
          <div
            key={sub.id}
            className={`flex items-center gap-2 border-b border-border px-3 py-1.5 last:border-b-0 ${
              isHighlight ? "bg-accent/[0.05]" : ""
            }`}
          >
            <span
              className={`w-4 font-syne text-xs font-extrabold ${rankPosClass(index)}`}
            >
              {index + 1}
            </span>
            <div
              className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full font-syne text-[9px] font-bold"
              style={{ background: palette.bg, color: palette.color }}
            >
              {userInitials(name)}
            </div>
            <span className="min-w-0 flex-1 truncate text-xs text-text">
              {name}
              {isLeader && index === 0 && sub.user_id === highlightUserId && (
                <span className="ml-1 text-[10px] text-muted2">🏆 recorde</span>
              )}
              {isHighlight && sub.user_id === user?.id && !isLeader && (
                <span className="ml-1 text-[10px] text-muted2">• tu</span>
              )}
            </span>
            <span
              className={`font-syne text-xs font-bold ${
                index === 0 ? "text-accent" : "text-muted2"
              }`}
            >
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
