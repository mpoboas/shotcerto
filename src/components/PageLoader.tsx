export function PageLoader({ label = "A carregar…" }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <p className="font-syne text-sm font-bold text-muted2">{label}</p>
    </div>
  );
}
