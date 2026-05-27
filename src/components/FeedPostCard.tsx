import { useCallback, useEffect, useState } from "react";
import { FeedPostVideo } from "./FeedPostVideo";
import { FeedPostRank } from "./FeedPostRank";
import { ChallengeChips } from "./ChallengeChips";
import { CommentsBottomSheet } from "./CommentsBottomSheet";
import { formatChallengeSummary } from "../lib/challenges";
import { drinkMeta, vesselTitle } from "../lib/drinks";
import {
  avatarPalette,
  formatRelativeTime,
  scoreTone,
  userInitials,
} from "../lib/feedHelpers";
import {
  challengeTypeLabel,
  formatSeconds,
  formatSecondsShort,
} from "../lib/format";
import { countComments } from "../lib/comments";
import {
  fetchReactionSummary,
  setReaction,
  type ReactionSummary,
} from "../lib/reactions";
import type { ChallengeRecord, SubmissionRecord } from "../lib/pocketbase";
import { resolveUsername, resolveAvatarUrl, type PbUserRecord } from "../lib/users";
import { useAuth } from "../hooks/useAuth";

export function FeedPostCard({ post }: { post: SubmissionRecord }) {
  const { user } = useAuth();
  const challenge = post.expand?.challenge_id;
  const author = post.expand?.user_id as PbUserRecord | undefined;
  const name = author ? resolveUsername(author) : "—";
  const avatarUrl = author ? resolveAvatarUrl(author) : undefined;
  const palette = avatarPalette(name);
  const challengeTitle = challenge
    ? formatChallengeSummary(challenge)
    : "Tentativa";
  const timeAgo = formatRelativeTime(post.created);
  const tone = challenge
    ? scoreTone(challenge.type, post.delta_seconds)
    : "ok";

  const [reactions, setReactions] = useState<ReactionSummary | null>(null);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  const loadReactions = useCallback(async () => {
    const s = await fetchReactionSummary(post.id, user?.id);
    setReactions(s);
  }, [post.id, user?.id]);

  const refreshCommentCount = useCallback(async () => {
    const n = await countComments(post.id);
    setCommentCount(n);
    setCommentsEnabled(true);
  }, [post.id]);

  useEffect(() => {
    void loadReactions();
    void refreshCommentCount().catch(() => setCommentsEnabled(false));
  }, [loadReactions, refreshCommentCount]);

  const primaryPill = `Bebida: ${formatSecondsShort(post.duration_seconds)}`;
  const secondaryPill = challenge
    ? challenge.type === "exact_time" && challenge.target_seconds != null
      ? `🎯 Alvo: ${formatSeconds(challenge.target_seconds)}`
      : (() => {
          const drink = drinkMeta(challenge.drink_type ?? "mistura");
          const qty = challenge.quantity ?? 1;
          const vessel = vesselTitle(
            challenge.quantity_unit ?? "shot",
            qty,
          );
          return `${drink.emoji} ${drink.label} · ${qty > 1 ? `${qty} ${vessel}` : vessel}`;
        })()
    : undefined;

  async function onReact(type: "like" | "dislike") {
    if (!user || reactionBusy || !reactions?.enabled) return;
    setReactionBusy(true);
    try {
      const next = await setReaction(post.id, type);
      setReactions(next);
    } finally {
      setReactionBusy(false);
    }
  }

  return (
    <article className="mb-1 border-b border-border pb-1 last:border-b-0">
      <header className="flex items-center gap-2.5 px-3.5 py-2.5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full border-2 border-border object-cover"
          />
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border font-syne text-xs font-bold"
            style={{ background: palette.bg, color: palette.color }}
          >
            {userInitials(name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-tight text-text">{name}</p>
          {challenge && <ChallengeChips challenge={challenge} />}
        </div>
        <ScoreDisplay
          challenge={challenge}
          delta={post.delta_seconds}
          duration={post.duration_seconds}
          tone={tone}
        />
      </header>

      <FeedPostVideo
        url={post.video_url}
        primaryPill={primaryPill}
        secondaryPill={secondaryPill}
      />

      <div className="flex flex-col gap-1.5 px-3.5 pb-2 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-syne text-[13px] font-bold text-text">
            {challengeTitle}
          </span>
          {challenge && (
            <span
              className={`shrink-0 rounded-[5px] px-2 py-0.5 font-syne text-[9px] font-bold uppercase tracking-wide ${
                challenge.type === "exact_time"
                  ? "bg-blue/15 text-blue"
                  : "bg-orange/15 text-orange"
              }`}
            >
              {challengeTypeLabel(challenge.type)}
            </span>
          )}
        </div>

        <div className="flex items-center">
          {reactions?.enabled && (
            <>
              <button
                type="button"
                disabled={!user || reactionBusy}
                onClick={() => void onReact("like")}
                className={`action-btn flex items-center gap-1.5 pr-3 text-[13px] ${
                  reactions.mine === "like" ? "text-accent" : "text-muted2"
                }`}
                aria-pressed={reactions.mine === "like"}
              >
                <ThumbsUpIcon filled={reactions.mine === "like"} />
                <span>{reactions.likes}</span>
              </button>
              <button
                type="button"
                disabled={!user || reactionBusy}
                onClick={() => void onReact("dislike")}
                className={`action-btn flex items-center gap-1.5 pr-3 text-[13px] ${
                  reactions.mine === "dislike"
                    ? "text-[#ff4d4d]"
                    : "text-muted2"
                }`}
                aria-pressed={reactions.mine === "dislike"}
              >
                <ThumbsDownIcon filled={reactions.mine === "dislike"} />
                <span>{reactions.dislikes}</span>
              </button>
            </>
          )}
          {commentsEnabled && (
            <button
              type="button"
              onClick={() => setCommentsOpen(true)}
              className="action-btn flex items-center gap-1.5 text-[13px] text-muted2"
            >
              <CommentIcon />
              <span>{commentCount}</span>
            </button>
          )}
          <span className="ml-auto text-[11px] text-muted2">{timeAgo}</span>
        </div>
      </div>

      {challenge && (
        <FeedPostRank challenge={challenge} highlightUserId={post.user_id} />
      )}

      <CommentsBottomSheet
        open={commentsOpen}
        submissionId={post.id}
        onClose={() => {
          setCommentsOpen(false);
          void refreshCommentCount();
        }}
        onCountChange={setCommentCount}
      />
    </article>
  );
}

function ScoreDisplay({
  challenge,
  delta,
  duration,
  tone,
}: {
  challenge?: ChallengeRecord;
  delta?: number;
  duration: number;
  tone: "good" | "ok";
}) {
  const color = tone === "good" ? "text-accent" : "text-orange";

  if (challenge?.type === "exact_time") {
    const d = delta ?? 0;
    const parts = d.toFixed(2).split(".");
    return (
      <div
        className={`shrink-0 text-right font-syne text-[17px] font-extrabold leading-none tracking-tight ${color}`}
      >
        Δ {parts[0]}.{parts[1]}
        <small className="block text-[10px] font-medium text-muted2">s</small>
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 text-right font-syne text-[17px] font-extrabold leading-none tracking-tight ${color}`}
    >
      {duration.toFixed(1)}
      <small className="block text-[10px] font-medium text-muted2">s</small>
    </div>
  );
}

function ThumbsUpIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${filled ? "fill-accent stroke-accent" : "fill-none stroke-current"}`}
      strokeWidth="1.8"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function ThumbsDownIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-5 w-5 ${filled ? "fill-[#ff4d4d] stroke-[#ff4d4d]" : "fill-none stroke-current"}`}
      strokeWidth="1.8"
    >
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
      <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
