import { type ChallengeFormInput, type VideoRange } from "./challenges";
import { resolveCatalogMode } from "./modes";
import { ensureAuthToken } from "./auth";
import { getChallenge } from "./queries";
import { pb, type ChallengeRecord } from "./pocketbase";
import {
  assertValidClipRange,
  submissionClipMeta,
} from "./videoTrim";

const PRESIGN_URL = import.meta.env.VITE_PRESIGN_URL;
if (!PRESIGN_URL) {
  throw new Error("VITE_PRESIGN_URL não está definido");
}

interface PresignResponse {
  presignedUrl: string;
  r2Key: string;
  publicUrl: string;
  expiresIn: number;
}

async function requestPresignedUrl(): Promise<PresignResponse> {
  const token = await ensureAuthToken();
  const res = await fetch(`${PRESIGN_URL.replace(/\/$/, "")}/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify({ contentType: "video/mp4" }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const json = JSON.parse(text) as { error?: string; hint?: string };
      if (json.hint) detail = json.hint;
      else if (json.error) detail = json.error;
    } catch {
      /* raw text */
    }
    if (res.status === 401) {
      throw new Error(
        detail === "unauthorized" || !detail
          ? "Upload recusado (sessão inválida). Confirma que o Worker tem o mesmo POCKETBASE_URL da app e volta a iniciar sessão."
          : `Upload recusado: ${detail}`,
      );
    }
    throw new Error(`Falha a obter presigned URL (${res.status}): ${detail}`);
  }
  return (await res.json()) as PresignResponse;
}

async function putToR2(
  presignedUrl: string,
  blob: Blob,
  onProgress?: (ratio: number) => void,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", "video/mp4");
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(event.loaded / event.total);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload R2 falhou (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Erro de rede no upload"));
    xhr.send(blob);
  });
}

export function calculateScore(
  challenge: Pick<ChallengeRecord, "type" | "target_seconds">,
  durationSeconds: number,
): number | undefined {
  if (challenge.type !== "exact_time") return undefined;
  if (typeof challenge.target_seconds !== "number") return undefined;
  return Math.abs(durationSeconds - challenge.target_seconds);
}

export interface UploadInput {
  challengeForm: ChallengeFormInput;
  blob: Blob;
  /** Duração do trecho de bebida (não do clip inteiro). */
  drinkDurationSeconds: number;
  /** Duração do vídeo original (antes do corte). */
  originalVideoDuration: number;
  onUploadProgress?: (ratio: number) => void;
}

export async function uploadSubmission({
  challengeForm,
  blob,
  drinkDurationSeconds,
  originalVideoDuration,
  onUploadProgress,
}: UploadInput) {
  const userId = pb.authStore.record?.id;
  if (!userId) throw new Error("Sessão expirada");

  const challenge = await resolveCatalogMode(challengeForm);
  return createSubmissionRecord({
    challenge,
    userId,
    blob,
    drinkRange: challengeForm.range,
    originalVideoDuration,
    drinkDurationSeconds,
    onUploadProgress,
  });
}

export interface JoinUploadInput {
  challengeId: string;
  blob: Blob;
  drinkRange: VideoRange;
  originalVideoDuration: number;
  drinkDurationSeconds: number;
  onUploadProgress?: (ratio: number) => void;
}

export async function uploadSubmissionToChallenge({
  challengeId,
  blob,
  drinkRange,
  originalVideoDuration,
  drinkDurationSeconds,
  onUploadProgress,
}: JoinUploadInput) {
  const userId = pb.authStore.record?.id;
  if (!userId) throw new Error("Sessão expirada");

  const challenge = await getChallenge(challengeId);
  return createSubmissionRecord({
    challenge,
    userId,
    blob,
    drinkRange,
    originalVideoDuration,
    drinkDurationSeconds,
    onUploadProgress,
  });
}

async function createSubmissionRecord({
  challenge,
  userId,
  blob,
  drinkRange,
  originalVideoDuration,
  drinkDurationSeconds,
  onUploadProgress,
}: {
  challenge: ChallengeRecord;
  userId: string;
  blob: Blob;
  drinkRange: VideoRange;
  originalVideoDuration: number;
  drinkDurationSeconds: number;
  onUploadProgress?: (ratio: number) => void;
}) {
  const presign = await requestPresignedUrl();
  await putToR2(presign.presignedUrl, blob, onUploadProgress);

  const { clip } = submissionClipMeta(drinkRange, originalVideoDuration);
  const clipRange = assertValidClipRange(clip);
  const deltaSeconds = calculateScore(challenge, drinkDurationSeconds);

  // PB trata "Required" em Number como ≠ 0 — início da bebida no clip pode ser 0.
  const body: Record<string, unknown> = {
    challenge_id: challenge.id,
    user_id: userId,
    video_r2_key: presign.r2Key,
    video_url: presign.publicUrl,
    duration_seconds: drinkDurationSeconds,
    range_start_seconds: clipRange.start,
    range_end_seconds: clipRange.end,
  };
  if (deltaSeconds != null && Number.isFinite(deltaSeconds)) {
    body.delta_seconds = deltaSeconds;
  }

  return pb.collection("submissions").create(body);
}
