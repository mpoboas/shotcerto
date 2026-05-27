import { useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { TopBarBack } from "../../components/TopBarBack";
import { StepIndicator } from "../../components/StepIndicator";
import { TypeSelector } from "../../components/TypeSelector";
import { TargetSlider } from "../../components/TargetSlider";
import {
  VideoLoadedBox,
  VideoUploadEmpty,
} from "../../components/VideoLoadedBox";
import { useSubmitWizard } from "../../context/SubmitWizardContext";
import { useVideoCompress } from "../../context/VideoCompressContext";
import { TARGET_MIN_SECONDS } from "../../lib/targetTime";

export function StepVideo() {
  const navigate = useNavigate();
  const wizard = useSubmitWizard();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    ffmpeg,
    pickFile,
    clearFile,
    sourcePreviewSrc,
    duration,
    probing,
    error,
    dismissError,
  } = useVideoCompress();

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
    e.target.value = "";
  }

  const hasVideo = !!sourcePreviewSrc && !!wizard.file;
  const canContinue =
    hasVideo &&
    !probing &&
    duration != null &&
    duration > 0 &&
    (wizard.type !== "exact_time" ||
      wizard.targetSeconds >= TARGET_MIN_SECONDS);

  return (
    <>
      <TopBarBack title="Nova submissão" />
      <StepIndicator total={3} current={1} />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <div>
          <p className="sec-lbl">Vídeo</p>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />
          {hasVideo ? (
            <VideoLoadedBox
              src={sourcePreviewSrc}
              fileName={wizard.file!.name}
              duration={duration}
              onChangeFile={() => {
                clearFile();
                inputRef.current?.click();
              }}
            />
          ) : (
            <VideoUploadEmpty onPick={() => inputRef.current?.click()} />
          )}
          {probing && (
            <p className="mt-2 text-center text-xs text-muted2">
              A ler vídeo…
            </p>
          )}
          {ffmpeg.status === "loading" && (
            <p className="mt-2 text-center text-xs text-muted2">
              A preparar compressor…
            </p>
          )}
          {error && (
            <p className="mt-2 text-center text-xs text-red-400">
              {error}{" "}
              <button type="button" className="underline" onClick={dismissError}>
                OK
              </button>
            </p>
          )}
        </div>

        {hasVideo && duration != null && (
          <>
            <div>
              <p className="sec-lbl">Tipo de desafio</p>
              <TypeSelector
                value={wizard.type}
                onChange={(type) => wizard.patch({ type })}
              />
            </div>

            {wizard.type === "exact_time" && (
              <div>
                <p className="sec-lbl">Tempo alvo</p>
                <TargetSlider
                  value={wizard.targetSeconds}
                  onChange={(targetSeconds) =>
                    wizard.patch({ targetSeconds })
                  }
                />
              </div>
            )}
          </>
        )}

        <button
          type="button"
          className="btn-primary mt-auto"
          disabled={!canContinue}
          onClick={() => navigate("/submit/range")}
        >
          Continuar →
        </button>
      </div>
    </>
  );
}
