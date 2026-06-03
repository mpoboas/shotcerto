import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthPageShell,
  authInputClass,
} from "../components/AuthPageShell";
import { useAuth } from "../hooks/useAuth";
import { formatPocketBaseError } from "../lib/pbError";

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
      setError(formatPocketBaseError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      title="Entrar"
      subtitle="Inicia sessão para participar nos desafios."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthField label="Email">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Password">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
        {error && <AuthError message={error} />}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary disabled:opacity-60"
        >
          {submitting ? "A entrar…" : "Entrar"}
        </button>
        <AuthFooterLink
          text="Sem conta?"
          linkText="Criar conta"
          to="/register"
        />
      </form>
    </AuthPageShell>
  );
}
