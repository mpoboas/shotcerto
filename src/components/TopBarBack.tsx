import { useNavigate } from "react-router-dom";

export function TopBarBack({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-2.5 border-b border-border px-5 py-3">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border2 bg-surface2"
        aria-label="Voltar"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 stroke-text"
          fill="none"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="font-syne text-base font-bold text-text">{title}</span>
    </header>
  );
}
