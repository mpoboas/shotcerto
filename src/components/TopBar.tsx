import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-2">
      <Logo />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface"
          aria-label="Notificações"
          disabled
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 stroke-text"
            fill="none"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <Link
          to="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface"
          aria-label="Perfil"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 stroke-text"
            fill="none"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
