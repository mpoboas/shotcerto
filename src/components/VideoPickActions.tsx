type VideoPickActionsProps = {
  onGallery: () => void;
  onCamera: () => void;
  layout?: "row" | "stack";
  className?: string;
};

export function VideoPickActions({
  onGallery,
  onCamera,
  layout = "row",
  className = "",
}: VideoPickActionsProps) {
  const btnClass =
    "rounded-[var(--radius-sm)] border border-border2 bg-surface2 px-3 py-2.5 text-sm font-medium text-text transition-colors hover:border-accent/40 disabled:opacity-50";

  if (layout === "stack") {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <button type="button" onClick={onGallery} className={`w-full ${btnClass}`}>
          Galeria
        </button>
        <button type="button" onClick={onCamera} className={`w-full ${btnClass}`}>
          Gravar vídeo
        </button>
      </div>
    );
  }

  return (
    <div className={`flex w-full gap-2 ${className}`}>
      <button type="button" onClick={onGallery} className={`flex-1 ${btnClass}`}>
        Galeria
      </button>
      <button type="button" onClick={onCamera} className={`flex-1 ${btnClass}`}>
        Gravar
      </button>
    </div>
  );
}
