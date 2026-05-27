import { useCallback, useMemo, useRef, useState } from "react";
import type { VideoRange } from "../lib/challenges";

const MIN_GAP = 0.1;
const BAR_COUNT = 48;

function randomHeights(seed: number): number[] {
  const out: number[] = [];
  let s = seed;
  for (let i = 0; i < BAR_COUNT; i++) {
    s = (s * 9301 + 49297) % 233280;
    out.push(4 + (s / 233280) * 24);
  }
  return out;
}

interface Props {
  duration: number;
  range: VideoRange;
  onChange: (range: VideoRange) => void;
  disabled?: boolean;
}

export function WaveRangeScrubber({
  duration,
  range,
  onChange,
  disabled,
}: Props) {
  const max = Math.max(duration, MIN_GAP * 2);
  const barRef = useRef<HTMLDivElement>(null);
  const heights = useMemo(() => randomHeights(Math.round(max * 100)), [max]);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);

  const startPct = (range.start / max) * 100;
  const endPct = (range.end / max) * 100;
  const segment = Math.max(0, range.end - range.start);

  const setStart = useCallback(
    (raw: number) => {
      const start = Math.max(0, Math.min(raw, max - MIN_GAP));
      const end = Math.max(start + MIN_GAP, range.end);
      onChange({ start, end: Math.min(end, max) });
    },
    [max, range.end, onChange],
  );

  const setEnd = useCallback(
    (raw: number) => {
      const end = Math.min(max, Math.max(raw, MIN_GAP));
      const start = Math.min(range.start, end - MIN_GAP);
      onChange({ start: Math.max(0, start), end });
    },
    [max, range.start, onChange],
  );

  const pointerToSeconds = useCallback(
    (clientX: number) => {
      const el = barRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * max;
    },
    [max],
  );

  const onPointerDown =
    (which: "start" | "end") => (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragging(which);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || disabled) return;
    const sec = pointerToSeconds(e.clientX);
    if (dragging === "start") setStart(sec);
    else setEnd(sec);
  };

  const onPointerUp = () => setDragging(null);

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-3.5">
      <div className="font-syne text-[13px] font-bold text-text">
        Seleciona início e fim
      </div>
      <p className="mb-3.5 mt-1 text-xs text-muted2">
        Arrasta os handles para definir o momento exato em que começas e acabas
        de beber
      </p>

      <div
        ref={barRef}
        className="relative mb-1.5 h-9 overflow-hidden rounded-lg bg-surface2"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-0 flex items-center gap-0.5 px-1">
          {heights.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-white/[0.08]"
              style={{ height: h }}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 border-x-2 border-accent bg-accent/10"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        />
        <div
          className="absolute inset-y-0 z-10 flex w-2.5 -translate-x-1/2 cursor-col-resize items-center justify-center touch-none"
          style={{ left: `${startPct}%` }}
          onPointerDown={onPointerDown("start")}
        >
          <div className="h-[18px] w-[3px] rounded-sm bg-accent" />
        </div>
        <div
          className="absolute inset-y-0 z-10 flex w-2.5 translate-x-1/2 cursor-col-resize items-center justify-center touch-none"
          style={{ right: `${100 - endPct}%` }}
          onPointerDown={onPointerDown("end")}
        >
          <div className="h-[18px] w-[3px] rounded-sm bg-accent" />
        </div>
      </div>

      <div className="flex justify-between font-syne text-[11px] font-bold text-muted2">
        <span>0.0s</span>
        <span className="text-accent">▶ {range.start.toFixed(1)}s</span>
        <span className="text-accent">{range.end.toFixed(1)}s ◀</span>
        <span>{max.toFixed(1)}s</span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-[7px] border border-accent/15 bg-accent-dim px-3 py-2.5">
        <span className="text-xs text-muted2">Duração selecionada</span>
        <span className="font-syne text-lg font-extrabold text-accent">
          {segment.toFixed(1)}
          <span className="text-xs font-normal text-muted2">s</span>
        </span>
      </div>
    </div>
  );
}
