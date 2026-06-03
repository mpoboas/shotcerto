import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { AvatarPicker } from "../components/AvatarPicker";
import {
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthPageShell,
  authInputClass,
} from "../components/AuthPageShell";
import { useAuth } from "../hooks/useAuth";
import { formatPocketBaseError } from "../lib/pbError";

const MIN_PASSWORD_LENGTH = 8;

export function Register() {
  const { register, isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
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

    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A password deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== passwordConfirm) {
      setError("As passwords não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: trimmedEmail,
        password,
        passwordConfirm,
        displayName: trimmedName,
        avatarFile: avatarFile ?? undefined,
      });
    } catch (err) {
      setError(formatPocketBaseError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      title="Criar conta"
      subtitle="Junta-te aos desafios com os teus amigos."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <p className="mb-2 text-sm text-muted2">Foto de perfil</p>
          <AvatarPicker
            displayName={displayName}
            previewUrl={avatarPreviewUrl}
            onPreviewUrlChange={setAvatarPreviewUrl}
            onFileChange={setAvatarFile}
            onValidationError={setError}
          />
        </div>
        <AuthField label="Nome">
          <input
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
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
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Confirmar password">
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
        {error && <AuthError message={error} />}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary disabled:opacity-60"
        >
          {submitting ? "A criar conta…" : "Criar conta"}
        </button>
        <AuthFooterLink
          text="Já tens conta?"
          linkText="Inicia sessão"
          to="/login"
        />
      </form>
    </AuthPageShell>
  );
}
