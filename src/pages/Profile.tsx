import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { UserAvatar } from "../components/UserAvatar";
import { PageLoader } from "../components/PageLoader";
import { useAuth } from "../hooks/useAuth";
import { type SubmissionRecord } from "../lib/pocketbase";
import { listMySubmissions } from "../lib/queries";
import { formatChallengeSummary } from "../lib/challenges";
import { formatDelta, formatSeconds } from "../lib/format";

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<SubmissionRecord[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    listMySubmissions(user.id)
      .then((items) => {
        if (active) setSubmissions(items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Erro");
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return <PageLoader />;

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <TopBar />
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-4">
        <header className="flex items-center gap-4 pt-2">
          <UserAvatar
            name={user.username}
            imageUrl={user.avatar_url}
            size={64}
            linkToProfile={false}
          />
          <div>
            <h1 className="font-syne text-xl font-bold text-text">
              {user.username}
            </h1>
            {user.email && (
              <p className="text-sm text-muted2">{user.email}</p>
            )}
          </div>
        </header>

        <section>
          <h2 className="mb-2 font-syne text-sm font-bold uppercase tracking-wide text-muted2">
            As minhas submissões
          </h2>
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : !submissions ? (
            <PageLoader />
          ) : submissions.length === 0 ? (
            <p className="rounded-[var(--radius)] border border-border bg-surface px-4 py-8 text-center text-sm text-muted2">
              Ainda não submeteste nenhum vídeo.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {submissions.map((sub) => {
                const challenge = sub.expand?.challenge_id;
                const result =
                  challenge?.type === "exact_time"
                    ? formatDelta(sub.delta_seconds ?? 0)
                    : formatSeconds(sub.duration_seconds);
                return (
                  <li
                    key={sub.id}
                    className="rounded-[var(--radius)] border border-border bg-surface p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-text">
                        {challenge
                          ? formatChallengeSummary(challenge)
                          : "Desafio removido"}
                      </span>
                      <span className="shrink-0 font-syne text-sm font-bold text-accent">
                        {result}
                      </span>
                    </div>
                    <a
                      href={sub.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-accent"
                    >
                      Ver vídeo
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-[var(--radius)] border border-border2 bg-surface2 px-4 py-3 text-sm font-medium text-text"
        >
          Terminar sessão
        </button>
      </div>
    </>
  );
}
