import type { VideoRange } from "./challenges";

/** Segundos extra antes do início e depois do fim da bebida no ficheiro guardado. */
export const TRIM_PAD_SECONDS = 1;

export function drinkDuration(range: VideoRange): number {
  return Math.max(0, range.end - range.start);
}

/** Intervalo do clip final: [início−1s, fim+1s] limitado ao vídeo. */
export function computeTrimRange(
  drink: VideoRange,
  videoDuration: number,
): VideoRange {
  return {
    start: Math.max(0, drink.start - TRIM_PAD_SECONDS),
    end: Math.min(videoDuration, drink.end + TRIM_PAD_SECONDS),
  };
}

/** Posição da bebida dentro do clip cortado (para metadados na BD). */
export function drinkRangeInClip(
  drink: VideoRange,
  trimStart: number,
): VideoRange {
  return {
    start: drink.start - trimStart,
    end: drink.end - trimStart,
  };
}

/** Metadados do clip para guardar na submissão (sempre derivados do range de bebida). */
export function submissionClipMeta(
  drink: VideoRange,
  videoDuration: number,
): { trim: VideoRange; clip: VideoRange } {
  const trim = computeTrimRange(drink, videoDuration);
  const clip = drinkRangeInClip(drink, trim.start);
  return { trim, clip };
}

export function assertValidClipRange(range: VideoRange): VideoRange {
  const start = Number(range.start);
  const end = Number(range.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw new Error("Intervalo do clip inválido para guardar na BD.");
  }
  return { start, end };
}
