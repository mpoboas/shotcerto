import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBarBack } from "../../components/TopBarBack";
import { StepIndicator } from "../../components/StepIndicator";
import { ChipGrid } from "../../components/ChipGrid";
import { QuantitySelector } from "../../components/QuantitySelector";
import { SummaryCard } from "../../components/SummaryCard";
import { useSubmitWizard } from "../../context/SubmitWizardContext";
import { useVideoCompress } from "../../context/VideoCompressContext";
import { DRINK_OPTIONS, VESSEL_OPTIONS, drinkMeta, vesselMeta } from "../../lib/drinks";
import {
  challengeTypeLabel,
  formatDelta,
  formatSecondsShort,
} from "../../lib/format";
import { formatQuantityLabel } from "../../lib/quantity";
import { validateChallengeForm } from "../../lib/challenges";
import { uploadSubmission } from "../../lib/upload";

export function StepConfirm() {
  const navigate = useNavigate();
  const wizard = useSubmitWizard();
  const {
    processing,
    waitForProcessedBlob,
    startBackgroundProcess,
    error: processError,
  } = useVideoCompress();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!wizard.file || wizard.videoDuration == null) {
    navigate("/submit", { replace: true });
    return null;
  }

  if (wizard.range.end <= wizard.range.start) {
    navigate("/submit/range", { replace: true });
    return null;
  }

  useEffect(() => {
    startBackgroundProcess();
  }, [startBackgroundProcess]);

  const form = wizard.toChallengeForm();
  const formError = validateChallengeForm(form, wizard.videoDuration);
  const segment = wizard.segmentDuration;
  const delta =
    wizard.type === "exact_time"
      ? Math.abs(segment - wizard.targetSeconds)
      : null;

  const drink = drinkMeta(wizard.drinkType);
  const vessel = vesselMeta(wizard.vessel);

  async function onSubmit() {
    if (formError) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await waitForProcessedBlob();
      await uploadSubmission({
        challengeForm: form,
        blob,
        drinkDurationSeconds: segment,
        originalVideoDuration: wizard.videoDuration!,
      });
      wizard.reset();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no envio");
    } finally {
      setUploading(false);
    }
  }

  const busy = uploading || processing;
  const submitLabel = uploading
    ? processing
      ? "A aguardar processamento…"
      : "A submeter…"
    : processing
      ? "Submeter (a processar vídeo) 🎯"
      : "Submeter shot 🎯";

  return (
    <>
      <TopBarBack title="Nova submissão" />
      <StepIndicator total={3} current={3} />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        {processing && (
          <p className="text-center text-xs text-muted2">
            A cortar e comprimir o vídeo em segundo plano…
          </p>
        )}

        <div>
          <p className="sec-lbl">Quantidade</p>
          <QuantitySelector
            choice={wizard.quantityChoice}
            customValue={wizard.quantityCustom}
            onChoiceChange={(quantityChoice) =>
              wizard.patch({ quantityChoice })
            }
            onCustomChange={(quantityCustom) =>
              wizard.patch({ quantityCustom })
            }
          />
        </div>

        <div>
          <p className="sec-lbl">Recipiente</p>
          <ChipGrid
            options={VESSEL_OPTIONS.map((v) => ({
              value: v.value,
              label: v.label,
              emoji: v.emoji,
            }))}
            value={wizard.vessel}
            onChange={(vessel) =>
              wizard.patch({ vessel: vessel as typeof wizard.vessel })
            }
          />
        </div>

        <div>
          <p className="sec-lbl">Bebida</p>
          <ChipGrid
            options={DRINK_OPTIONS.map((d) => ({
              value: d.value,
              label: d.label,
              emoji: d.emoji,
            }))}
            value={wizard.drinkType}
            onChange={(drinkType) => wizard.patch({ drinkType })}
          />
        </div>

        <div>
          <p className="sec-lbl">Resumo</p>
          <SummaryCard
            title="A tua submissão"
            rows={[
              {
                key: "Tipo",
                value: challengeTypeLabel(wizard.type),
                blue: wizard.type === "exact_time",
              },
              ...(wizard.type === "exact_time"
                ? [{ key: "Alvo", value: formatSecondsShort(wizard.targetSeconds) }]
                : []),
              {
                key: "Quantidade",
                value: formatQuantityLabel(wizard.quantity),
              },
              {
                key: "Bebida (intervalo)",
                value: `${wizard.range.start.toFixed(1)}s → ${wizard.range.end.toFixed(1)}s`,
              },
              { key: "Duração bebida", value: formatSecondsShort(segment) },
              ...(delta != null
                ? [{ key: "Delta", value: formatDelta(delta), accent: true }]
                : []),
              {
                key: "Recipiente",
                value: `${vessel.emoji} ${vessel.label}`,
              },
              { key: "Bebida", value: `${drink.emoji} ${drink.label}` },
            ]}
          />
        </div>

        {formError && (
          <p className="text-center text-xs text-red-400">{formError}</p>
        )}
        {(error || processError) && (
          <p className="text-center text-xs text-red-400">
            {error ?? processError}
          </p>
        )}

        <button
          type="button"
          className="btn-primary mt-auto"
          disabled={!!formError || busy}
          onClick={() => void onSubmit()}
        >
          {submitLabel}
        </button>
      </div>
    </>
  );
}
