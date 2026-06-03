import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  VideoFileInputs,
  type VideoFileInputsHandle,
} from "../../components/VideoFileInputs";
import { TopBarBack } from "../../components/TopBarBack";
import { CompressProgressBar } from "../../components/CompressProgressBar";
import { VideoRangePlayer } from "../../components/VideoRangePlayer";
import { VideoUploadEmpty } from "../../components/VideoLoadedBox";
import { SummaryCard } from "../../components/SummaryCard";
import { PageLoader } from "../../components/PageLoader";
import { getChallenge } from "../../lib/queries";
import { formatChallengeSummary } from "../../lib/challenges";
import {
  challengeTypeLabel,
  formatDelta,
  formatSecondsShort,
} from "../../lib/format";
import { drinkVesselLabel } from "../../lib/drinks";
import { type ChallengeRecord } from "../../lib/pocketbase";
import { uploadSubmissionToChallenge } from "../../lib/upload";
import { trimAndCompressVideo, MAX_INPUT_BYTES } from "../../lib/ffmpeg";
import { probeVideoDuration } from "../../lib/videoProbe";
import { computeTrimRange, drinkDuration } from "../../lib/videoTrim";
import { useFfmpeg } from "../../hooks/useFfmpeg";
import type { VideoRange } from "../../lib/challenges";

export function JoinSubmit() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const ffmpeg = useFfmpeg(true);
  const videoInputsRef = useRef<VideoFileInputsHandle>(null);

  const [challenge, setChallenge] = useState<ChallengeRecord | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [range, setRange] = useState<VideoRange>({ start: 0, end: 0 });
  const [processing, setProcessing] = useState(false);
  const [processRatio, setProcessRatio] = useState(0);
  const [probing, setProbing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challengeId) return;
    getChallenge(challengeId)
      .then(setChallenge)
      .catch(() => setError("Desafio não encontrado"));
  }, [challengeId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onRangeChange = useCallback((next: VideoRange) => {
    setRange(next);
  }, []);

  async function applyVideoFile(f: File) {
    if (f.size > MAX_INPUT_BYTES) {
      setError("Ficheiro demasiado grande.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setError(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setProbing(true);
    try {
      const dur = await probeVideoDuration(url);
      setDuration(dur);
      setRange({ start: 0, end: dur });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ler o vídeo");
    } finally {
      setProbing(false);
    }
  }

  const segment = drinkDuration(range);
  const delta =
    challenge?.type === "exact_time" && challenge.target_seconds != null
      ? Math.abs(segment - challenge.target_seconds)
      : null;

  async function onSubmit() {
    if (!challengeId || !file || duration == null) return;
    setUploading(true);
    setError(null);
    try {
      const trim = computeTrimRange(range, duration);
      setProcessing(true);
      setProcessRatio(0);
      const result = await trimAndCompressVideo(file, trim, (r) =>
        setProcessRatio(r),
      );
      setProcessing(false);
      await uploadSubmissionToChallenge({
        challengeId,
        blob: result.blob,
        drinkRange: range,
        originalVideoDuration: duration,
        drinkDurationSeconds: segment,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no envio");
      setProcessing(false);
    } finally {
      setUploading(false);
    }
  }

  if (!challenge) {
    return error && !file ? (
      <p className="px-4 py-8 text-center text-sm text-red-400">{error}</p>
    ) : (
      <PageLoader />
    );
  }

  const hasVideo = !!previewUrl && !!file;
  const rangeValid =
    duration != null &&
    range.end > range.start &&
    range.end <= duration + 0.05 &&
    segment >= 0.3;
  const busy = processing || uploading;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CompressProgressBar active={processing} ratio={processRatio} />
      <TopBarBack title="Participar" />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <SummaryCard
          title={formatChallengeSummary(challenge)}
          rows={[
            {
              key: "Tipo",
              value: challengeTypeLabel(challenge.type),
              blue: challenge.type === "exact_time",
            },
            ...(challenge.type === "exact_time"
              ? [
                  {
                    key: "Alvo",
                    value: formatSecondsShort(challenge.target_seconds ?? 0),
                  },
                ]
              : []),
            {
              key: "Bebida",
              value: drinkVesselLabel(
                challenge.drink_type ?? "mistura",
                challenge.quantity_unit ?? "shot",
              ),
            },
          ]}
        />

        <div>
          <p className="sec-lbl">Vídeo</p>
          <VideoFileInputs ref={videoInputsRef} onFile={applyVideoFile} />
          {!hasVideo ? (
            <VideoUploadEmpty
              onPickGallery={() => videoInputsRef.current?.pickFromGallery()}
              onPickCamera={() => videoInputsRef.current?.pickFromCamera()}
            />
          ) : null}
          {probing && (
            <p className="mt-2 text-center text-xs text-muted2">A ler vídeo…</p>
          )}
          {ffmpeg.status === "loading" && (
            <p className="mt-2 text-center text-xs text-muted2">
              A preparar compressor…
            </p>
          )}
        </div>

        {hasVideo && duration != null && (
          <>
            <VideoRangePlayer
              src={previewUrl}
              duration={duration}
              range={range}
              onChange={onRangeChange}
            />
            {delta != null && (
              <div className="flex items-center justify-between rounded-[var(--radius)] border border-blue/20 bg-surface p-3.5">
                <div className="text-xs text-muted2">Delta atual</div>
                <div className="font-syne text-[28px] font-extrabold text-blue">
                  {formatDelta(delta)}
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <p className="text-center text-xs text-red-400">{error}</p>
        )}

        <button
          type="button"
          className="btn-primary mt-auto"
          disabled={!hasVideo || !rangeValid || busy || probing}
          onClick={() => void onSubmit()}
        >
          {processing
            ? "A cortar e comprimir…"
            : uploading
              ? "A submeter…"
              : "Submeter participação 🎯"}
        </button>
      </div>
    </div>
  );
}
