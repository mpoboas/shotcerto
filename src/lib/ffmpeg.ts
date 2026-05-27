import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

/**
 * Single-thread @ffmpeg/core ESM, copied to public/ffmpeg/ at install time.
 *
 * Why ST (not core-mt):
 *   ffmpeg.wasm 0.12.x uses a `type: "module"` worker that loads core via
 *   dynamic import() — which requires ESM. Multi-thread also spawns classic
 *   pthread workers using importScripts(), which can ONLY load UMD. There's
 *   no single core file that satisfies both, so MT is broken on Vite with
 *   0.12.x. Single-thread has no pthread workers, so ESM works end-to-end.
 *
 * Why toBlobURL (not direct /ffmpeg/ URL):
 *   Vite's dev server blocks dynamic import() of files in /public/. fetch()
 *   still serves them statically, so toBlobURL wraps them in a Blob and we
 *   pass a blob: URL to ffmpeg.load(), bypassing Vite's transform pipeline.
 */
const CORE_BASE = "/ffmpeg";

export const MAX_INPUT_BYTES = 500 * 1024 * 1024;

let instance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

export type LoadProgress = (ratio: number) => void;

function formatError(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  if (err && typeof err === "object") {
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  return "Erro desconhecido ao carregar FFmpeg";
}

export async function loadFfmpeg(onProgress?: LoadProgress): Promise<FFmpeg> {
  if (instance?.loaded) return instance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();
    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => onProgress(progress));
    }
    try {
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
        toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
      ]);
      await ffmpeg.load({ coreURL, wasmURL });
      instance = ffmpeg;
      return ffmpeg;
    } catch (err) {
      try {
        ffmpeg.terminate();
      } catch {
        // ignore
      }
      throw new Error(`Falha a inicializar FFmpeg: ${formatError(err)}`);
    }
  })();

  try {
    return await loadPromise;
  } catch (err) {
    instance = null;
    throw err instanceof Error ? err : new Error(formatError(err));
  } finally {
    loadPromise = null;
  }
}

function parseDurationFromLogs(logs: string[]): number | null {
  const joined = logs.join("\n");
  const match = joined.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const [, h, m, s] = match;
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

export async function probeDuration(file: File): Promise<number> {
  const ffmpeg = await loadFfmpeg();
  const inputName = `probe-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  const logs: string[] = [];
  const handler = ({ message }: { type: string; message: string }) => {
    logs.push(message);
  };
  ffmpeg.on("log", handler);
  try {
    await ffmpeg.exec(["-i", inputName, "-f", "null", "-"]).catch(() => {
      // ffmpeg exits 1 with -f null when no output sink; we only need the logs.
    });
  } finally {
    ffmpeg.off("log", handler);
    await ffmpeg.deleteFile(inputName).catch(() => {});
  }

  const duration = parseDurationFromLogs(logs);
  if (duration === null || Number.isNaN(duration)) {
    throw new Error("Não foi possível extrair a duração do vídeo");
  }
  return duration;
}

export interface CompressResult {
  blob: Blob;
  durationSeconds: number;
  originalBytes: number;
  compressedBytes: number;
}

export interface TrimRange {
  start: number;
  end: number;
}

/** Corta o intervalo indicado e comprime (720p H.264). Usado após o user definir o range. */
export async function trimAndCompressVideo(
  file: File,
  trim: TrimRange,
  onProgress?: (ratio: number) => void,
): Promise<CompressResult> {
  if (trim.end <= trim.start) {
    throw new Error("Intervalo de corte inválido.");
  }
  return encodeVideo(file, onProgress, trim);
}

export async function compressVideo(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<CompressResult> {
  return encodeVideo(file, onProgress);
}

async function encodeVideo(
  file: File,
  onProgress?: (ratio: number) => void,
  trim?: TrimRange,
): Promise<CompressResult> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(
      `Ficheiro demasiado grande (${Math.round(file.size / 1024 / 1024)}MB). Máximo 500MB.`,
    );
  }
  const ffmpeg = await loadFfmpeg();

  const progressHandler = ({ progress }: { progress: number }) => {
    if (onProgress) onProgress(Math.max(0, Math.min(1, progress)));
  };
  ffmpeg.on("progress", progressHandler);

  const inputName = `input-${Date.now()}.${file.name.split(".").pop() ?? "mp4"}`;
  const outputName = `output-${Date.now()}.mp4`;
  const logs: string[] = [];
  const logHandler = ({ message }: { type: string; message: string }) => {
    logs.push(message);
  };
  ffmpeg.on("log", logHandler);

  const args = ["-i", inputName];
  if (trim) {
    args.push("-ss", String(trim.start), "-to", String(trim.end));
  }
  args.push(
    "-vcodec",
    "libx264",
    "-vf",
    "scale=-2:720",
    "-b:v",
    "1000k",
    "-acodec",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputName,
  );

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const bytes =
      data instanceof Uint8Array
        ? data
        : new TextEncoder().encode(String(data));
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: "video/mp4" });

    const duration = parseDurationFromLogs(logs);
    if (duration === null || Number.isNaN(duration)) {
      throw new Error("Não foi possível determinar a duração do vídeo");
    }

    return {
      blob,
      durationSeconds: duration,
      originalBytes: file.size,
      compressedBytes: blob.size,
    };
  } finally {
    ffmpeg.off("progress", progressHandler);
    ffmpeg.off("log", logHandler);
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}
