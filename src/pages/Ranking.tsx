import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { LeaderboardPanel } from "../components/LeaderboardPanel";
import { PageLoader } from "../components/PageLoader";
import {
  type ChallengeRecord,
  type SubmissionRecord,
} from "../lib/pocketbase";
import { listSubmissionsForChallenge } from "../lib/queries";
import { listCatalogModes, buildModeSlug, modeKeyFromChallenge } from "../lib/modes";
import {
  challengeBadgeClass,
  challengeTypeLabel,
  formatSeconds,
} from "../lib/format";
import { formatChallengeSummary } from "../lib/challenges";

export function Ranking() {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");

  const [modes, setModes] = useState<ChallengeRecord[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRecord[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCatalogModes()
      .then((items) => {
        setModes(items);
        if (items.length === 0) return;
        if (modeParam) {
          const match = items.find(
            (m) => buildModeSlug(modeKeyFromChallenge(m)) === modeParam,
          );
          setSelectedId(match?.id ?? items[0].id);
        } else {
          setSelectedId(items[0].id);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro"));
  }, [modeParam]);

  const selected = useMemo(
    () => modes?.find((c) => c.id === selectedId) ?? null,
    [modes, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    let active = true;
    setSubmissions(null);
    listSubmissionsForChallenge(selected, { limit: 100, expandUser: true })
      .then((items) => {
        if (active) setSubmissions(items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Erro");
      });
    return () => {
      active = false;
    };
  }, [selected]);

  return (
    <>
      <TopBar />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <header>
          <h1 className="font-syne text-2xl font-extrabold text-text">
            Ranking
          </h1>
          <p className="text-sm text-muted2">Competição por modo de jogo.</p>
        </header>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!modes ? (
          <PageLoader />
        ) : modes.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-border bg-surface px-4 py-8 text-center text-sm text-muted2">
            Ainda não há modos com tentativas. Publica no feed em Submeter.
          </p>
        ) : (
          <>
            <label className="block">
              <span className="sec-lbl">Modo</span>
              <select
                value={selectedId ?? ""}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-[10px] border border-border2 bg-surface2 px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
              >
                {modes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatChallengeSummary(c)}
                  </option>
                ))}
              </select>
            </label>

            {selected && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 font-syne text-[10px] font-bold uppercase ${challengeBadgeClass(selected.type)}`}
                >
                  {challengeTypeLabel(selected.type)}
                </span>
                {selected.type === "exact_time" && (
                  <span className="text-xs text-muted2">
                    Alvo: {formatSeconds(selected.target_seconds ?? 0)}
                  </span>
                )}
              </div>
            )}

            {!submissions ? (
              <PageLoader />
            ) : selected ? (
              <LeaderboardPanel
                challenge={selected}
                submissions={submissions}
                limit={100}
              />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
