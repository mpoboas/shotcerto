import { useNavigate } from "react-router-dom";
import { TopBarBack } from "../../components/TopBarBack";
import { StepIndicator } from "../../components/StepIndicator";
import { VideoRangePlayer } from "../../components/VideoRangePlayer";
import { useSubmitWizard } from "../../context/SubmitWizardContext";
import { useVideoCompress } from "../../context/VideoCompressContext";
import { formatDelta } from "../../lib/format";

export function StepRange() {
  const navigate = useNavigate();
  const wizard = useSubmitWizard();
  const { sourcePreviewSrc, duration, startBackgroundProcess } =
    useVideoCompress();

  if (!sourcePreviewSrc || duration == null || !wizard.file) {
    navigate("/submit", { replace: true });
    return null;
  }

  const segment = wizard.segmentDuration;
  const delta =
    wizard.type === "exact_time"
      ? Math.abs(segment - wizard.targetSeconds)
      : null;

  const rangeValid =
    wizard.range.end > wizard.range.start &&
    wizard.range.end <= duration + 0.05 &&
    segment >= 0.3;

  function onContinue() {
    startBackgroundProcess();
    navigate("/submit/confirm");
  }

  return (
    <>
      <TopBarBack title="Nova submissão" />
      <StepIndicator total={3} current={2} />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <div>
          <p className="sec-lbl">Recortar range de bebida</p>
          <VideoRangePlayer
            src={sourcePreviewSrc}
            duration={duration}
            range={wizard.range}
            onChange={(r) => wizard.setDrinkRange(r)}
          />
        </div>

        {wizard.type === "exact_time" && delta != null && (
          <div className="flex items-center justify-between rounded-[var(--radius)] border border-blue/20 bg-surface p-3.5">
            <div>
              <div className="mb-1 text-xs text-muted2">
                Alvo: {wizard.targetSeconds.toFixed(1)}s · Bebida:{" "}
                {segment.toFixed(1)}s
              </div>
              <div className="text-xs text-muted2">Delta atual</div>
            </div>
            <div className="font-syne text-[28px] font-extrabold text-blue">
              {formatDelta(delta)}
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn-primary mt-auto"
          disabled={!rangeValid}
          onClick={onContinue}
        >
          Continuar →
        </button>
      </div>
    </>
  );
}
