import type { ChallengeType } from "../lib/pocketbase";

const TYPES: {
  value: ChallengeType;
  icon: string;
  name: string;
  desc: string;
  selectedClass: string;
}[] = [
  {
    value: "exact_time",
    icon: "🎯",
    name: "Tempo exato",
    desc: "Beber o mais próximo de um tempo alvo",
    selectedClass: "border-blue bg-blue-dim",
  },
  {
    value: "speed_run",
    icon: "⚡",
    name: "Mais rápido",
    desc: "Beber o mais rápido possível",
    selectedClass: "border-orange bg-orange-dim",
  },
];

export function TypeSelector({
  value,
  onChange,
}: {
  value: ChallengeType;
  onChange: (t: ChallengeType) => void;
}) {
  return (
    <div className="flex gap-2">
      {TYPES.map((t) => {
        const selected = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex flex-1 flex-col gap-1.5 rounded-[10px] border-[1.5px] bg-surface p-3.5 text-left transition-colors ${
              selected ? t.selectedClass : "border-border2"
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="font-syne text-[13px] font-bold text-text">
              {t.name}
            </span>
            <span className="text-[11px] leading-snug text-muted2">
              {t.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
