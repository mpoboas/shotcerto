interface Chip {
  value: string;
  label: string;
  emoji?: string;
}

export function ChipGrid({
  options,
  value,
  onChange,
}: {
  options: readonly Chip[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "border-accent bg-accent-dim text-accent"
                : "border-border2 bg-surface text-text"
            }`}
          >
            {opt.emoji && <span className="text-[15px]">{opt.emoji}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
