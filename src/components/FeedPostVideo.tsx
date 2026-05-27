import { useRef, useState } from "react";

interface Props {
  url: string;
  primaryPill: string;
  secondaryPill?: string;
}

export function FeedPostVideo({ url, primaryPill, secondaryPill }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);

  function onPlayClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || failed) return;
    if (v.paused) void v.play().catch(() => setFailed(true));
    else v.pause();
  }

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden bg-[#0a0a0a]"
      onClick={onPlayClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          onPlayClick(e as unknown as React.MouseEvent);
      }}
    >
      <video
        ref={videoRef}
        src={url}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v?.duration) return;
          setProgress((v.currentTime / v.duration) * 100);
        }}
        onError={() => setFailed(true)}
      />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/75"
        aria-hidden
      />

      {!playing && !failed && (
        <div className="absolute left-1/2 top-1/2 z-[2] flex h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[1.5px] border-white/25 bg-black/35 backdrop-blur-md">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-white">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      )}

      {failed ? (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/60 px-3 text-center text-[11px] text-muted2">
          Vídeo indisponível
          <br />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 text-accent underline"
            onClick={(e) => e.stopPropagation()}
          >
            Abrir link
          </a>
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-1 left-0 right-0 z-[2] p-3.5 pb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-xs font-medium text-white/85 backdrop-blur-md">
              <ClockIcon />
              {primaryPill}
            </span>
            {secondaryPill && (
              <span className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-xs font-medium text-white/85 backdrop-blur-md">
                {secondaryPill}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-[3] h-[3px] bg-white/15">
        <div
          className="h-full bg-accent transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[13px] w-[13px] stroke-white/70"
      fill="none"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
