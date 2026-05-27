/** Barra fina no topo durante compressão em background. */
export function CompressProgressBar({
  active,
  ratio,
}: {
  active: boolean;
  ratio: number;
}) {
  if (!active) return null;
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
  return (
    <div
      className="relative z-50 h-0.5 w-full shrink-0 overflow-hidden bg-white/[0.06]"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="A cortar e comprimir vídeo"
    >
      <div
        className="h-full bg-accent/70 transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
