import { useRef } from "react";

export function VideoLoadedBox({
  src,
  fileName,
  duration,
  onChangeFile,
  compact,
}: {
  src: string;
  fileName: string;
  duration: number | null;
  onChangeFile: () => void;
  compact?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-accent/15 bg-[#0c1a0a]">
      <div
        className={`relative flex items-center justify-center bg-gradient-to-br from-[#0f1a08] to-[#1a2e10] ${
          compact ? "h-[120px]" : "h-40"
        }`}
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <video
          ref={videoRef}
          src={src}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          playsInline
          muted
        />
        <button
          type="button"
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            if (v.paused) void v.play();
            else v.pause();
          }}
          className="relative z-[2] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] backdrop-blur-sm"
        >
          <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-white">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
      {!compact && (
        <div className="flex items-center justify-between px-3 py-2.5">
          <div>
            <div className="text-[13px] font-medium text-text">{fileName}</div>
            {duration != null && (
              <div className="font-syne text-xs text-muted2">
                Duração total: {duration.toFixed(1)}s
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onChangeFile}
            className="text-xs text-accent"
          >
            trocar
          </button>
        </div>
      )}
    </div>
  );
}

export function VideoUploadEmpty({ onPick }: { onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="relative flex h-[200px] w-full flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[var(--radius)] border border-border bg-[#0f1a0a]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(232,255,71,0.05) 0%, transparent 65%)",
        }}
      />
      <div className="relative z-[1] flex h-[52px] w-[52px] items-center justify-center rounded-full border border-accent/20 bg-accent/10">
        <svg
          viewBox="0 0 24 24"
          className="ml-0.5 h-[22px] w-[22px] stroke-accent"
          fill="none"
          strokeWidth="2"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
      <span className="relative z-[1] font-syne text-sm font-bold text-text">
        Carregar vídeo
      </span>
      <span className="relative z-[1] text-xs text-muted2">
        MP4 ou MOV · máx. 200 MB
      </span>
    </button>
  );
}
