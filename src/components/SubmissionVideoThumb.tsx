import { useRef, useState } from "react";

interface Props {
  url: string;
  className?: string;
}

/** Preview com playback real (URL pública R2). */
export function SubmissionVideoThumb({ url, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  function onPlayClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || failed) return;
    if (v.paused) {
      void v.play().catch(() => setFailed(true));
    } else {
      v.pause();
    }
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={onPlayClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onPlayClick(e as unknown as React.MouseEvent);
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
        onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      {!playing && !failed && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/25">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/13 bg-white/[0.07] backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}
      {failed && (
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
      )}
    </div>
  );
}
