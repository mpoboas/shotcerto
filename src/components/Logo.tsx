export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`font-syne text-xl font-extrabold tracking-tight text-text ${className}`}>
      Shot<em className="not-italic text-accent">.</em>Certo
    </div>
  );
}
