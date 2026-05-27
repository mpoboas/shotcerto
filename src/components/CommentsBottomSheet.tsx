import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../hooks/useAuth";
import {
  addComment,
  listCommentThreads,
  type CommentThread,
} from "../lib/comments";
import {
  avatarPalette,
  formatRelativeTime,
  userInitials,
} from "../lib/feedHelpers";
import { resolveUsername, resolveAvatarUrl, type PbUserRecord } from "../lib/users";

interface Props {
  open: boolean;
  submissionId: string;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export function CommentsBottomSheet({
  open,
  submissionId,
  onClose,
  onCountChange,
}: Props) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [enabled, setEnabled] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCommentThreads(submissionId);
      setThreads(data);
      const total =
        data.reduce((n, t) => n + 1 + t.replies.length, 0);
      onCountChange?.(total);
      setEnabled(true);
    } catch {
      setThreads([]);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [submissionId, onCountChange]);

  useEffect(() => {
    if (!open) return;
    void load();
    setReplyTo(null);
    setDraft("");
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      await addComment(submissionId, draft, replyTo?.id);
      setDraft("");
      setReplyTo(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const meName = user?.username ?? "?";
  const mePalette = avatarPalette(meName);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Comentários"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative flex max-h-[78dvh] flex-col rounded-t-[20px] border-t border-white/10 bg-[#181818]">
        <div className="flex justify-center py-2.5">
          <div className="h-1 w-9 rounded-sm bg-white/[0.18]" />
        </div>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-[18px] pb-3 pt-0">
          <h2 className="font-syne text-[15px] font-bold text-text">
            Comentários
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07]"
            aria-label="Fechar comentários"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 stroke-muted2"
              fill="none"
              strokeWidth="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[18px] py-3.5">
          {!enabled ? (
            <p className="py-6 text-center text-sm text-muted2">
              Comentários indisponíveis.
            </p>
          ) : loading ? (
            <p className="py-6 text-center text-sm text-muted2">A carregar…</p>
          ) : threads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted2">
              Sem comentários ainda. Sê o primeiro!
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {threads.map(({ comment, replies }) => (
                <li key={comment.id}>
                  <CommentRow
                    record={comment}
                    onReply={(id, name) => {
                      setReplyTo({ id, name });
                      setDraft(`@${name} `);
                    }}
                  />
                  {replies.length > 0 && (
                    <ul className="ml-10 mt-3 flex flex-col gap-3 border-l border-border pl-3">
                      {replies.map((r) => (
                        <li key={r.id}>
                          <CommentRow
                            record={r}
                            onReply={(_id, name) => {
                              setReplyTo({ id: comment.id, name });
                              setDraft(`@${name} `);
                            }}
                            compact
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {enabled && (
          <form
            onSubmit={(e) => void onSubmit(e)}
            className="flex items-center gap-2.5 border-t border-white/[0.07] px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-2.5"
          >
            <div
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full font-syne text-[10px] font-bold"
              style={{ background: mePalette.bg, color: mePalette.color }}
            >
              {userInitials(meName)}
            </div>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                replyTo
                  ? `Resposta a ${replyTo.name}…`
                  : "Adicionar comentário…"
              }
              maxLength={500}
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-[13px] text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent disabled:opacity-40"
              aria-label="Enviar"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 stroke-[#0a0a0a]"
                fill="none"
                strokeWidth="2.5"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

function CommentRow({
  record,
  onReply,
  compact = false,
}: {
  record: import("../lib/pocketbase").CommentRecord;
  onReply: (id: string, name: string) => void;
  compact?: boolean;
}) {
  const author = record.expand?.user_id as PbUserRecord | undefined;
  const name = author ? resolveUsername(author) : "—";
  const avatarUrl = author ? resolveAvatarUrl(author) : undefined;
  const palette = avatarPalette(name);
  const size = compact ? 28 : 32;

  return (
    <div className="flex gap-2.5">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="shrink-0 rounded-full object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="flex shrink-0 items-center justify-center rounded-full font-syne text-[11px] font-bold"
          style={{
            width: size,
            height: size,
            background: palette.bg,
            color: palette.color,
          }}
        >
          {userInitials(name)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-baseline gap-1.5">
          <span className="text-xs font-medium text-text">{name}</span>
          <span className="text-[11px] text-muted2">
            {formatRelativeTime(record.created)}
          </span>
        </div>
        <p className="text-[13px] leading-snug text-white/80">{record.body}</p>
        <button
          type="button"
          onClick={() => onReply(record.id, name)}
          className="mt-1 text-[11px] text-muted2 hover:text-text"
        >
          Responder
        </button>
      </div>
    </div>
  );
}
