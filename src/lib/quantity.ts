export type QuantityChoice = "1" | "2" | "3" | "4" | "5" | "other";

export const QUANTITY_PRESET_OPTIONS = [
  { value: "1" as const, label: "1×" },
  { value: "2" as const, label: "2×" },
  { value: "3" as const, label: "3×" },
  { value: "4" as const, label: "4×" },
  { value: "5" as const, label: "5×" },
  { value: "other" as const, label: "Outro" },
];

export const MIN_CUSTOM_QUANTITY = 5;

export function resolvedQuantity(
  choice: QuantityChoice,
  custom: number,
): number {
  if (choice !== "other") return Number(choice);
  return Math.max(MIN_CUSTOM_QUANTITY, Math.floor(custom));
}

export function formatQuantityLabel(qty: number): string {
  return `${qty}×`;
}
