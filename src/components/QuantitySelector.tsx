import { ChipGrid } from "./ChipGrid";
import {
  MIN_CUSTOM_QUANTITY,
  QUANTITY_PRESET_OPTIONS,
  type QuantityChoice,
} from "../lib/quantity";

export function QuantitySelector({
  choice,
  customValue,
  onChoiceChange,
  onCustomChange,
}: {
  choice: QuantityChoice;
  customValue: number;
  onChoiceChange: (c: QuantityChoice) => void;
  onCustomChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ChipGrid
        options={QUANTITY_PRESET_OPTIONS}
        value={choice}
        onChange={(v) => onChoiceChange(v as QuantityChoice)}
      />
      {choice === "other" && (
        <div className="flex items-center justify-center gap-4 rounded-[var(--radius)] border border-border bg-surface px-4 py-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border2 bg-surface2 font-syne text-lg font-bold text-text transition-opacity hover:border-accent disabled:opacity-30"
            disabled={customValue <= MIN_CUSTOM_QUANTITY}
            onClick={() =>
              onCustomChange(Math.max(MIN_CUSTOM_QUANTITY, customValue - 1))
            }
            aria-label="Menos"
          >
            −
          </button>
          <span className="min-w-[3ch] text-center font-syne text-2xl font-extrabold text-accent">
            {customValue}
          </span>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border2 bg-surface2 font-syne text-lg font-bold text-text transition-opacity hover:border-accent"
            onClick={() => onCustomChange(customValue + 1)}
            aria-label="Mais"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
