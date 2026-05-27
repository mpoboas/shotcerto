import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type ChallengeRecord, type SubmissionRecord } from "../lib/pocketbase";
import {
  countSubmissions,
  listSubmissionsForChallenge,
} from "../lib/queries";
import { formatChallengeSummary } from "../lib/challenges";
import {
  challengeBadgeClass,
  challengeGlowClass,
  challengeThumbClass,
  challengeTypeLabel,
  formatDelta,
  formatSeconds,
} from "../lib/format";
import { drinkVesselLabel } from "../lib/drinks";
import { resolveUsername, type PbUserRecord } from "../lib/users";
import { SubmissionVideoThumb } from "./SubmissionVideoThumb";

export function ChallengeCard({ challenge }: { challenge: ChallengeRecord }) {
  const [submissions, setSubmissions] = useState<SubmissionRecord[] | null>(
    null,
  );
  const [attemptCount, setAttemptCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      listSubmissionsForChallenge(challenge, { limit: 1, expandUser: true }),
      countSubmissions(challenge.id),
    ])
      .then(([subs, count]) => {
        if (active) {
          setSubmissions(subs);
          setAttemptCount(count);
        }
      })
      .catch(() => {
        if (active) {
          setSubmissions([]);
          setAttemptCount(0);
        }
      });
    return () => {
      active = false;
    };
  }, [challenge]);

  const best = submissions?.[0];
  const bestName = best?.expand?.user_id
    ? resolveUsername(best.expand.user_id as PbUserRecord)
    : null;
  const bestScore = best
    ? challenge.type === "exact_time"
      ? formatDelta(best.delta_seconds ?? 0)
      : formatSeconds(best.duration_seconds)
    : null;

  const metaRight =
    challenge.type === "exact_time"
      ? `Alvo: ${(challenge.target_seconds ?? 0).toFixed(2)}s`
      : best
        ? `Recorde: ${best.duration_seconds.toFixed(1)}s`
        : "Sem recorde";

  const drinkLabel = drinkVesselLabel(
    challenge.drink_type ?? "mistura",
    challenge.quantity_unit ?? "shot",
  );

  return (
    <article className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
      <div
        className={`relative h-[140px] ${challengeThumbClass(challenge.type)}`}
      >
        {best?.video_url ? (
          <SubmissionVideoThumb
            url={best.video_url}
            className="h-full w-full"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <div
              className={`absolute h-[100px] w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full ${challengeGlowClass(challenge.type)}`}
              style={{ top: "50%", left: "50%" }}
            />
            <div className="relative z-[2] flex h-11 w-11 items-center justify-center rounded-full border border-white/13 bg-white/[0.07] backdrop-blur-sm">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-white">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
        )}
        <span
          className={`pointer-events-none absolute left-2.5 top-2.5 z-[3] rounded-md px-2 py-0.5 font-syne text-[10px] font-bold uppercase tracking-wide ${challengeBadgeClass(challenge.type)}`}
        >
          {challengeTypeLabel(challenge.type)}
        </span>
        <span className="pointer-events-none absolute bottom-2 right-2.5 z-[3] rounded-[5px] bg-black/40 px-1.5 py-0.5 text-[11px] text-white/50 backdrop-blur-sm">
          {drinkLabel}
        </span>
      </div>

      <div className="px-3.5 pb-2.5 pt-3">
        <h3 className="font-syne text-[15px] font-bold leading-snug text-text">
          {formatChallengeSummary(challenge)}
        </h3>
        <div className="mt-1.5 flex gap-3.5 text-xs text-muted2">
          <span className="flex items-center gap-1">
            <UsersIcon />
            {attemptCount ?? "…"} tentativas
          </span>
          <span className="flex items-center gap-1">
            {challenge.type === "exact_time" ? <ClockIcon /> : <TrendIcon />}
            {metaRight}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-3.5 py-2.5">
        <p className="text-xs text-muted2">
          Melhor:{" "}
          <strong className="font-medium text-text">
            {bestName && bestScore ? `${bestName} — ${bestScore}` : "—"}
          </strong>
        </p>
        <Link
          to={`/submit/join/${challenge.id}`}
          className="rounded-lg bg-accent px-4 py-1.5 font-syne text-xs font-bold text-[#0a0a0a]"
        >
          Participar
        </Link>
      </div>
    </article>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-muted2" fill="none" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-muted2" fill="none" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-muted2" fill="none" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
