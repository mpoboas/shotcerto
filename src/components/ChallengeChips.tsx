import type { ChallengeRecord } from "../lib/pocketbase";
import { drinkMeta, vesselMeta } from "../lib/drinks";

function vesselChipLabel(unit: string): string {
  const v = vesselMeta(unit);
  const short = v.label.split(" (")[0] ?? v.label;
  return `${v.emoji} ${short}`;
}

export function ChallengeChips({
  challenge,
}: {
  challenge: Pick<ChallengeRecord, "quantity" | "quantity_unit" | "drink_type">;
}) {
  const qty = challenge.quantity ?? 1;
  const drink = drinkMeta(challenge.drink_type ?? "mistura");
  const vessel = vesselChipLabel(challenge.quantity_unit ?? "shot");

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent/10 px-[7px] py-0.5 font-syne text-[10px] font-bold tracking-wide text-accent">
        {qty}×
      </span>
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.07] px-[7px] py-0.5 font-syne text-[10px] font-bold tracking-wide text-white/60">
        {vessel}
      </span>
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.07] px-[7px] py-0.5 font-syne text-[10px] font-bold tracking-wide text-white/60">
        {drink.label}
      </span>
    </div>
  );
}
