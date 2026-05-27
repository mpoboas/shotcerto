import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { trimAndCompressVideo, MAX_INPUT_BYTES } from "../lib/ffmpeg";
import { formatBytes } from "../lib/format";
import { probeVideoDuration } from "../lib/videoProbe";
import {
  computeTrimRange,
  drinkRangeInClip,
} from "../lib/videoTrim";
import { useFfmpeg } from "../hooks/useFfmpeg";
import { useSubmitWizard } from "./SubmitWizardContext";

type ProcessStatus =
  | { kind: "idle" }
  | { kind: "processing"; ratio: number }
  | { kind: "ready" }
  | { kind: "error"; message: string };

interface VideoCompressContextValue {
  ffmpeg: ReturnType<typeof useFfmpeg>;
  pickFile: (file: File) => void;
  clearFile: () => void;
  sourcePreviewSrc: string | null;
  duration: number | null;
  processing: boolean;
  processRatio: number;
  isProcessed: boolean;
  error: string | null;
  dismissError: () => void;
  /** Inicia corte+compressão em background (não bloqueia). */
  startBackgroundProcess: () => void;
  waitForProcessedBlob: () => Promise<Blob>;
  probing: boolean;
}

const VideoCompressContext = createContext<VideoCompressContextValue | null>(
  null,
);

export function VideoCompressProvider({ children }: { children: ReactNode }) {
  const {
    patch,
    file,
    previewUrl,
    processedPreviewUrl,
    processedBlob,
    videoDuration,
    range,
  } = useSubmitWizard();
  const ffmpeg = useFfmpeg(true);
  const [status, setStatus] = useState<ProcessStatus>({ kind: "idle" });
  const [probing, setProbing] = useState(false);
  const processingRef = useRef(false);
  const readyPromiseRef = useRef<{
    resolve: (b: Blob) => void;
    reject: (e: Error) => void;
  } | null>(null);

  const settleReady = useCallback((blob: Blob) => {
    readyPromiseRef.current?.resolve(blob);
    readyPromiseRef.current = null;
  }, []);

  const settleError = useCallback((err: Error) => {
    readyPromiseRef.current?.reject(err);
    readyPromiseRef.current = null;
  }, []);

  const runProcess = useCallback(async () => {
    if (!file || videoDuration == null) return;
    if (range.end <= range.start) return;
    if (processingRef.current) return;
    if (processedBlob && status.kind === "ready") {
      settleReady(processedBlob);
      return;
    }

    processingRef.current = true;
    setStatus({ kind: "processing", ratio: 0 });

    const trim = computeTrimRange(range, videoDuration);
    const clipRange = drinkRangeInClip(range, trim.start);
    patch({ trimRange: trim, clipRange });

    try {
      const result = await trimAndCompressVideo(file, trim, (ratio) =>
        setStatus({ kind: "processing", ratio }),
      );
      const url = URL.createObjectURL(result.blob);
      if (processedPreviewUrl) URL.revokeObjectURL(processedPreviewUrl);
      patch({
        processedBlob: result.blob,
        processedPreviewUrl: url,
        trimRange: trim,
        clipRange,
      });
      setStatus({ kind: "ready" });
      settleReady(result.blob);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao processar vídeo";
      setStatus({ kind: "error", message });
      settleError(err instanceof Error ? err : new Error(message));
    } finally {
      processingRef.current = false;
    }
  }, [
    file,
    videoDuration,
    range,
    processedBlob,
    processedPreviewUrl,
    status.kind,
    patch,
    settleReady,
    settleError,
  ]);

  const startBackgroundProcess = useCallback(() => {
    if (!file || videoDuration == null || range.end <= range.start) return;
    const trim = computeTrimRange(range, videoDuration);
    const clipRange = drinkRangeInClip(range, trim.start);
    patch({ trimRange: trim, clipRange });
    void runProcess();
  }, [file, videoDuration, range, patch, runProcess]);

  const waitForProcessedBlob = useCallback((): Promise<Blob> => {
    if (processedBlob) return Promise.resolve(processedBlob);
    if (status.kind === "error") {
      return Promise.reject(new Error(status.message));
    }
    if (status.kind === "ready" && processedBlob) {
      return Promise.resolve(processedBlob);
    }
    return new Promise<Blob>((resolve, reject) => {
      readyPromiseRef.current = { resolve, reject };
      if (!processingRef.current && status.kind === "idle") {
        void runProcess();
      }
    });
  }, [processedBlob, status, runProcess]);

  const pickFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_INPUT_BYTES) {
        setStatus({
          kind: "error",
          message: `Ficheiro demasiado grande (${formatBytes(file.size)}).`,
        });
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (processedPreviewUrl) URL.revokeObjectURL(processedPreviewUrl);
      processingRef.current = false;
      readyPromiseRef.current?.reject(new Error("cancelled"));
      readyPromiseRef.current = null;

      const url = URL.createObjectURL(file);
      patch({
        file,
        previewUrl: url,
        processedBlob: null,
        processedPreviewUrl: null,
        videoDuration: null,
        range: { start: 0, end: 0 },
        trimRange: null,
        clipRange: null,
      });
      setStatus({ kind: "idle" });
      setProbing(true);
      try {
        const dur = await probeVideoDuration(url);
        patch({
          videoDuration: dur,
          range: { start: 0, end: dur },
        });
      } catch (err) {
        setStatus({
          kind: "error",
          message:
            err instanceof Error ? err.message : "Erro ao ler o vídeo",
        });
      } finally {
        setProbing(false);
      }
    },
    [previewUrl, processedPreviewUrl, patch],
  );

  const clearFile = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (processedPreviewUrl) URL.revokeObjectURL(processedPreviewUrl);
    processingRef.current = false;
    readyPromiseRef.current?.reject(new Error("cancelled"));
    readyPromiseRef.current = null;
    patch({
      file: null,
      previewUrl: null,
      processedBlob: null,
      processedPreviewUrl: null,
      videoDuration: null,
      range: { start: 0, end: 0 },
      trimRange: null,
      clipRange: null,
    });
    setStatus({ kind: "idle" });
  }, [previewUrl, processedPreviewUrl, patch]);

  const sourcePreviewSrc = previewUrl;
  const processing = status.kind === "processing";
  const processRatio =
    status.kind === "processing"
      ? status.ratio
      : status.kind === "ready"
        ? 1
        : 0;

  const value = useMemo(
    (): VideoCompressContextValue => ({
      ffmpeg,
      pickFile: (f) => void pickFile(f),
      clearFile,
      sourcePreviewSrc,
      duration: videoDuration,
      processing,
      processRatio,
      isProcessed: !!processedBlob,
      error: status.kind === "error" ? status.message : null,
      dismissError: () => setStatus({ kind: "idle" }),
      startBackgroundProcess,
      waitForProcessedBlob,
      probing,
    }),
    [
      ffmpeg,
      pickFile,
      clearFile,
      sourcePreviewSrc,
      videoDuration,
      processing,
      processRatio,
      processedBlob,
      status,
      startBackgroundProcess,
      waitForProcessedBlob,
      probing,
    ],
  );

  return (
    <VideoCompressContext.Provider value={value}>
      {children}
    </VideoCompressContext.Provider>
  );
}

export function useVideoCompress() {
  const ctx = useContext(VideoCompressContext);
  if (!ctx) {
    throw new Error("useVideoCompress requires VideoCompressProvider");
  }
  return ctx;
}
