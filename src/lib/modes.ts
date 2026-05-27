import {
  buildChallengeTitle,
  type ChallengeFormInput,
} from "./challenges";
import { pb, type ChallengeRecord, type ChallengeType } from "./pocketbase";

export interface ModeKey {
  type: ChallengeType;
  drink_type: string;
  quantity_unit: string;
  target_seconds?: number;
}

/** Identificador estável do modo (catálogo / ranking). */
export function buildModeSlug(key: ModeKey): string {
  const base = `${key.type}_${key.drink_type}_${key.quantity_unit}`;
  if (key.type === "exact_time" && key.target_seconds != null) {
    return `${base}_${key.target_seconds}`;
  }
  return base;
}

export function modeKeyFromForm(input: ChallengeFormInput): ModeKey {
  return {
    type: input.type,
    drink_type: input.drink_type,
    quantity_unit: input.quantity_unit,
    target_seconds:
      input.type === "exact_time" ? input.target_seconds : undefined,
  };
}

export function modeKeyFromChallenge(
  challenge: Pick<
    ChallengeRecord,
    "type" | "drink_type" | "quantity_unit" | "target_seconds" | "slug"
  >,
): ModeKey {
  if (challenge.slug) {
    return parseModeSlug(challenge.slug);
  }
  return {
    type: challenge.type,
    drink_type: challenge.drink_type ?? "mistura",
    quantity_unit: challenge.quantity_unit ?? "shot",
    target_seconds: challenge.target_seconds,
  };
}

export function parseModeSlug(slug: string): ModeKey {
  const parts = slug.split("_");
  if (parts.length >= 4 && parts[0] === "exact") {
    const target = Number(parts[parts.length - 1]);
    const quantity_unit = parts[parts.length - 2];
    const drink_type = parts.slice(2, -2).join("_");
    return {
      type: "exact_time",
      drink_type,
      quantity_unit,
      target_seconds: Number.isFinite(target) ? target : undefined,
    };
  }
  if (parts[0] === "exact" && parts[1] === "time") {
    const target = Number(parts[parts.length - 1]);
    const quantity_unit = parts[parts.length - 2];
    const drink_type = parts.slice(2, -2).join("_");
    return {
      type: "exact_time",
      drink_type,
      quantity_unit,
      target_seconds: Number.isFinite(target) ? target : undefined,
    };
  }
  if (parts[0] === "speed" && parts[1] === "run") {
    return {
      type: "speed_run",
      drink_type: parts.slice(2, -1).join("_"),
      quantity_unit: parts[parts.length - 1] ?? "shot",
    };
  }
  return {
    type: "speed_run",
    drink_type: "mistura",
    quantity_unit: "shot",
  };
}

function modeRulesFilter(key: ModeKey): string {
  if (key.type === "exact_time" && key.target_seconds != null) {
    return pb.filter(
      "type = {:type} && drink_type = {:drink} && quantity_unit = {:unit} && target_seconds = {:target}",
      {
        type: key.type,
        drink: key.drink_type,
        unit: key.quantity_unit,
        target: key.target_seconds,
      },
    );
  }
  return pb.filter(
    "type = {:type} && drink_type = {:drink} && quantity_unit = {:unit}",
    { type: key.type, drink: key.drink_type, unit: key.quantity_unit },
  );
}

async function findModeBySlug(slug: string): Promise<ChallengeRecord | null> {
  try {
    return await pb.collection("challenges").getFirstListItem<ChallengeRecord>(
      pb.filter("slug = {:slug}", { slug }),
    );
  } catch {
    return null;
  }
}

async function findModeByRules(key: ModeKey): Promise<ChallengeRecord | null> {
  try {
    return await pb.collection("challenges").getFirstListItem<ChallengeRecord>(
      modeRulesFilter(key),
      { sort: "-created" },
    );
  } catch {
    return null;
  }
}

/** Modo partilhado para estas regras — reutiliza registo existente ou cria catálogo. */
export async function resolveCatalogMode(
  input: ChallengeFormInput,
): Promise<ChallengeRecord> {
  const key = modeKeyFromForm(input);
  const slug = buildModeSlug(key);

  const bySlug = await findModeBySlug(slug);
  if (bySlug) return bySlug;

  const byRules = await findModeByRules(key);
  if (byRules) return byRules;

  const userId = pb.authStore.record?.id;
  if (!userId) throw new Error("Sessão expirada");

  const title = buildChallengeTitle(input);
  const body: Record<string, unknown> = {
    title,
    type: input.type,
    drink_type: input.drink_type,
    quantity: input.quantity,
    quantity_unit: input.quantity_unit,
    target_seconds:
      input.type === "exact_time" ? input.target_seconds : undefined,
    created_by: userId,
    slug,
    is_catalog: true,
  };

  try {
    return await pb.collection("challenges").create<ChallengeRecord>(body);
  } catch {
    delete body.slug;
    delete body.is_catalog;
    const created = await pb.collection("challenges").create<ChallengeRecord>(body);
    const again = await findModeByRules(key);
    return again ?? created;
  }
}

/** Modos distintos para o selector de ranking (agrupa por slug/regras). */
export async function listCatalogModes(): Promise<ChallengeRecord[]> {
  const all = await pb.collection("challenges").getFullList<ChallengeRecord>({
    sort: "-created",
  });
  const bySlug = new Map<string, ChallengeRecord>();
  for (const c of all) {
    const slug = c.slug ?? buildModeSlug(modeKeyFromChallenge(c));
    if (!bySlug.has(slug)) bySlug.set(slug, c);
  }
  return Array.from(bySlug.values()).sort((a, b) =>
    (a.title ?? "").localeCompare(b.title ?? "", "pt"),
  );
}
