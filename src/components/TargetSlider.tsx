import {
  TARGET_MAX_SECONDS,
  TARGET_MIN_SECONDS,
  TARGET_STEP_SECONDS,
  snapTargetSeconds,
} from "../lib/targetTime";

export function TargetSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const snapped = snapTargetSeconds(value);
  const pct =
    ((snapped - TARGET_MIN_SECONDS) /
      (TARGET_MAX_SECONDS - TARGET_MIN_SECONDS)) *
    100;

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] text-muted2">Definir alvo</span>
        <span className="font-syne text-[28px] font-extrabold tracking-tight text-accent">
          {snapped.toFixed(1)}
          <span className="text-sm font-medium text-muted2">s</span>
        </span>
      </div>
      <div className="relative py-1">
        <div className="relative h-1 rounded-sm bg-surface2">
          <div
            className="absolute inset-y-0 left-0 rounded-sm bg-accent"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-accent shadow-[0_2px_8px_rgba(232,255,71,0.4)]"
            style={{ left: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={TARGET_MIN_SECONDS}
          max={TARGET_MAX_SECONDS}
          step={TARGET_STEP_SECONDS}
          value={snapped}
          onChange={(e) => onChange(snapTargetSeconds(Number(e.target.value)))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted2">
        <span>{TARGET_MIN_SECONDS}s</span>
        <span>{TARGET_MAX_SECONDS}s</span>
      </div>
    </div>
  );
}
