import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VideoRange } from "../lib/challenges";
import { drinkDuration } from "../lib/videoTrim";

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
  src: string;
  duration: number;
  range: VideoRange;
  onChange: (range: VideoRange) => void;
}

export function VideoRangePlayer({ src, duration, range, onChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);

  const max = Math.max(duration, MIN_GAP * 2);
  const heights = useMemo(() => randomHeights(Math.round(max * 100)), [max]);
  const segment = drinkDuration(range);

  const seekTo = useCallback((seconds: number, pause = true) => {
    const video = videoRef.current;
    if (!video) return;
    const t = Math.max(0, Math.min(seconds, max));
    video.currentTime = t;
    if (pause) video.pause();
  }, [max]);

  const setStart = useCallback(
    (raw: number, seek = true) => {
      const start = Math.max(0, Math.min(raw, max - MIN_GAP));
      const end = Math.max(start + MIN_GAP, range.end);
      const next = { start, end: Math.min(end, max) };
      onChange(next);
      if (seek) seekTo(start);
    },
    [max, range.end, onChange, seekTo],
  );

  const setEnd = useCallback(
    (raw: number, seek = true) => {
      const end = Math.min(max, Math.max(raw, MIN_GAP));
      const start = Math.min(range.start, end - MIN_GAP);
      const next = { start: Math.max(0, start), end };
      onChange(next);
      if (seek) seekTo(end);
    },
    [max, range.start, onChange, seekTo],
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

  const startPct = (range.start / max) * 100;
  const endPct = (range.end / max) * 100;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => {
      if (video.videoWidth && video.videoHeight) {
        setAspect(video.videoWidth / video.videoHeight);
      }
    };
    video.addEventListener("loadedmetadata", onMeta);
    onMeta();
    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, [src]);

  const onPointerDown =
    (which: "start" | "end") => (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(which);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      if (which === "start") setStart(range.start, true);
      else setEnd(range.end, true);
    };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const sec = pointerToSeconds(e.clientX);
    if (dragging === "start") setStart(sec, true);
    else setEnd(sec, true);
  };

  const onPointerUp = () => setDragging(null);

  const isPortrait = aspect != null && aspect < 1;

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-black">
      <div
        className={`flex w-full items-center justify-center bg-[#0c1a0a] ${
          isPortrait ? "min-h-[280px] max-h-[65dvh]" : "min-h-[160px] max-h-[45dvh]"
        }`}
      >
        <video
          ref={videoRef}
          src={src}
          className="max-h-[65dvh] w-full object-contain"
          playsInline
          preload="metadata"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            if (v.paused) void v.play();
            else v.pause();
          }}
        />
      </div>

      <div className="border-t border-border bg-surface p-3.5">
        <div className="font-syne text-[13px] font-bold text-text">
          Seleciona início e fim
        </div>
        <p className="mb-3 mt-1 text-xs text-muted2">
          Arrasta os handles — o vídeo salta para cada momento
        </p>

        <div
          ref={barRef}
          className="relative mb-1.5 h-9 touch-none overflow-hidden rounded-lg bg-surface2"
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
            className="absolute inset-y-0 z-10 flex w-3 -translate-x-1/2 cursor-col-resize items-center justify-center"
            style={{ left: `${startPct}%` }}
            onPointerDown={onPointerDown("start")}
          >
            <div className="h-5 w-1 rounded-sm bg-accent shadow-[0_0_8px_rgba(232,255,71,0.5)]" />
          </div>
          <div
            className="absolute inset-y-0 z-10 flex w-3 translate-x-1/2 cursor-col-resize items-center justify-center"
            style={{ right: `${100 - endPct}%` }}
            onPointerDown={onPointerDown("end")}
          >
            <div className="h-5 w-1 rounded-sm bg-accent shadow-[0_0_8px_rgba(232,255,71,0.5)]" />
          </div>
        </div>

        <div className="flex justify-between font-syne text-[11px] font-bold text-muted2">
          <span>0.0s</span>
          <span className="text-accent">▶ {range.start.toFixed(1)}s</span>
          <span className="text-accent">{range.end.toFixed(1)}s ◀</span>
          <span>{max.toFixed(1)}s</span>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-[7px] border border-accent/15 bg-accent-dim px-3 py-2.5">
          <span className="text-xs text-muted2">Duração da bebida</span>
          <span className="font-syne text-lg font-extrabold text-accent">
            {segment.toFixed(1)}
            <span className="text-xs font-normal text-muted2">s</span>
          </span>
        </div>
      </div>
    </div>
  );
}
