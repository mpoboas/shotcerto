import { pb, type ChallengeRecord, type ChallengeType } from "./pocketbase";
import { drinkMeta, vesselTitle, type VesselType } from "./drinks";
import { TARGET_MAX_SECONDS, TARGET_MIN_SECONDS, TARGET_STEP_SECONDS } from "./targetTime";

export type QuantityUnit = VesselType;

export interface VideoRange {
  start: number;
  end: number;
}

export interface ChallengeFormInput {
  type: ChallengeType;
  drink_type: string;
  quantity: number;
  quantity_unit: QuantityUnit;
  target_seconds?: number;
  range: VideoRange;
  title?: string;
}

export function rangeDuration(range: VideoRange): number {
  return Math.max(0, range.end - range.start);
}

export function buildChallengeTitle(input: ChallengeFormInput): string {
  if (input.title?.trim()) return input.title.trim();
  const drink = drinkMeta(input.drink_type).label.toLowerCase();
  const vesselWord = vesselTitle(input.quantity_unit, input.quantity);
  if (input.type === "exact_time" && input.target_seconds != null) {
    const cap = vesselWord.charAt(0).toUpperCase() + vesselWord.slice(1);
    return `${cap} de ${drink} em ${input.target_seconds}s`;
  }
  const qty = input.quantity > 1 ? `${input.quantity} ` : "";
  return `${qty}${vesselWord} de ${drink} o mais rápido`;
}

export function formatChallengeSummary(
  challenge: Pick<
    ChallengeRecord,
    | "type"
    | "drink_type"
    | "quantity"
    | "quantity_unit"
    | "target_seconds"
    | "title"
  >,
): string {
  if (challenge.title?.trim()) return challenge.title.trim();
  return buildChallengeTitle({
    type: challenge.type,
    drink_type: challenge.drink_type ?? "mistura",
    quantity: challenge.quantity ?? 1,
    quantity_unit: (challenge.quantity_unit as QuantityUnit) ?? "shot",
    target_seconds: challenge.target_seconds,
    range: { start: 0, end: 0 },
  });
}

export function validateChallengeForm(
  input: ChallengeFormInput,
  videoDuration: number | null,
): string | null {
  if (!input.type) return "Escolhe o tipo de desafio.";
  if (input.type === "exact_time") {
    if (
      input.target_seconds == null ||
      !Number.isFinite(input.target_seconds) ||
      input.target_seconds < TARGET_MIN_SECONDS
    ) {
      return "Indica o tempo alvo.";
    }
    if (input.target_seconds > TARGET_MAX_SECONDS) {
      return `O tempo alvo não pode passar ${TARGET_MAX_SECONDS}s.`;
    }
    const steps = (input.target_seconds - TARGET_MIN_SECONDS) / TARGET_STEP_SECONDS;
    if (Math.abs(steps - Math.round(steps)) > 0.001) {
      return `O tempo alvo tem de ser em intervalos de ${TARGET_STEP_SECONDS}s.`;
    }
  }
  if (
    !Number.isFinite(input.quantity) ||
    input.quantity < 1 ||
    !Number.isInteger(input.quantity)
  ) {
    return "Escolhe a quantidade.";
  }
  if (videoDuration == null || videoDuration <= 0) {
    return "Aguarda o vídeo carregar para definir o intervalo.";
  }
  if (input.range.end <= input.range.start) {
    return "O fim do intervalo tem de ser depois do início.";
  }
  if (input.range.end > videoDuration + 0.05) {
    return "O intervalo não pode passar a duração do vídeo.";
  }
  if (rangeDuration(input.range) < 0.3) {
    return "O intervalo tem de ter pelo menos 0,3 segundos.";
  }
  if (!input.drink_type) return "Escolhe o tipo de bebida.";
  if (!input.quantity_unit) return "Escolhe o recipiente.";
  return null;
}

export async function createChallenge(
  input: ChallengeFormInput,
): Promise<ChallengeRecord> {
  const userId = pb.authStore.record?.id;
  if (!userId) throw new Error("Sessão expirada");

  const title = buildChallengeTitle(input);

  return pb.collection("challenges").create<ChallengeRecord>({
    title,
    type: input.type,
    drink_type: input.drink_type,
    quantity: input.quantity,
    quantity_unit: input.quantity_unit,
    target_seconds:
      input.type === "exact_time" ? input.target_seconds : undefined,
    created_by: userId,
  });
}
