/** Listas no frontend — alinhar valores no select `drink_type` / `quantity_unit` do PocketBase. */

export const VESSEL_OPTIONS = [
  { value: "shot", label: "Shot", title: "shot", titlePlural: "shots", emoji: "🥃" },
  { value: "mini", label: "Mini (20cl)", title: "mini", titlePlural: "minis", emoji: "🍺" },
  { value: "fino", label: "Fino (25cl)", title: "fino", titlePlural: "finos", emoji: "🍺" },
  {
    value: "principe",
    label: "Príncipe (33cl)",
    title: "príncipe",
    titlePlural: "príncipes",
    emoji: "🍺",
  },
  { value: "caneca", label: "Caneca (50cl)", title: "caneca", titlePlural: "canecas", emoji: "🍺" },
  {
    value: "75",
    label: "Quarta-feira (75cl)",
    title: "quarta-feira",
    titlePlural: "quarta-feiras",
    emoji: "🍷",
  },
  { value: "litrosa", label: "Litrosa (1L)", title: "litrosa", titlePlural: "litrosas", emoji: "🍾" },
] as const;

export type VesselType = (typeof VESSEL_OPTIONS)[number]["value"];

export const DRINK_OPTIONS = [
  { value: "agua", label: "Água", emoji: "💧" },
  { value: "cerveja", label: "Cerveja", emoji: "🍺" },
  { value: "vinho", label: "Vinho", emoji: "🍷" },
  { value: "sangria", label: "Sangria", emoji: "🍹" },
  { value: "refrigerante", label: "Refrigerante", emoji: "🥤" },
  { value: "mistura", label: "Mistura", emoji: "🍹" },
] as const;

export type DrinkType = (typeof DRINK_OPTIONS)[number]["value"];

type VesselOption = (typeof VESSEL_OPTIONS)[number];

export function drinkMeta(value: string) {
  const d = DRINK_OPTIONS.find((x) => x.value === value);
  return d ?? { value, label: value, emoji: "🍹" };
}

export function vesselMeta(value: string): VesselOption | { value: string; label: string; title: string; titlePlural: string; emoji: string } {
  const v = VESSEL_OPTIONS.find((x) => x.value === value);
  if (v) return v;
  return { value, label: value, title: value, titlePlural: `${value}s`, emoji: "🥃" };
}

export function vesselTitle(value: string, quantity = 1): string {
  const v = vesselMeta(value);
  return quantity > 1 ? v.titlePlural : v.title;
}

export function drinkVesselLabel(drink: string, vessel: string): string {
  const d = drinkMeta(drink);
  const v = vesselMeta(vessel);
  return `${d.emoji} ${d.label} · ${v.label}`;
}
