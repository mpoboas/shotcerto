import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const { login, isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      const next = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(next, { replace: true });
    }
  }, [isReady, isAuthenticated, location.state, navigate]);

  if (isReady && isAuthenticated) return <Navigate to="/" replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro a iniciar sessão");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-dvh w-full flex-col justify-center bg-bg px-6 py-12"
      style={{
        paddingTop: "max(3rem, env(safe-area-inset-top))",
        paddingBottom: "max(3rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mb-10 text-center">
        <div className="mb-4 flex justify-center">
          <Logo className="text-3xl" />
        </div>
        <p className="text-sm text-muted2">
          Inicia sessão para participar nos desafios.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-muted2">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-[10px] border border-border2 bg-surface2 px-3 py-2.5 text-text focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted2">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-[10px] border border-border2 bg-surface2 px-3 py-2.5 text-text focus:border-accent focus:outline-none"
          />
        </label>
        {error && (
          <p className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary disabled:opacity-60"
        >
          {submitting ? "A entrar…" : "Entrar"}
        </button>
        <p className="text-center text-xs text-muted">
          Sem conta? Pede ao admin para te criar uma.
        </p>
      </form>
    </div>
  );
}
