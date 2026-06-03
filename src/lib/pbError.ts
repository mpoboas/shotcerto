import { ClientResponseError } from "pocketbase";

const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  password: "Password",
  passwordConfirm: "Confirmação da password",
  username: "Nome de utilizador",
  name: "Nome",
  avatar: "Foto de perfil",
};

export function formatPocketBaseError(err: unknown): string {
  if (!(err instanceof ClientResponseError)) {
    return err instanceof Error ? err.message : "Ocorreu um erro inesperado";
  }

  const data = err.response?.data as Record<string, unknown> | undefined;
  if (data && typeof data === "object") {
    const messages: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      const label = FIELD_LABELS[key] ?? key;
      if (typeof value === "object" && value !== null && "message" in value) {
        messages.push(`${label}: ${String((value as { message: string }).message)}`);
      } else if (typeof value === "string") {
        messages.push(`${label}: ${value}`);
      }
    }
    if (messages.length > 0) return messages.join(" ");
  }

  if (err.status === 0) return "Sem ligação ao servidor. Tenta novamente.";
  if (err.status === 400) return "Dados inválidos. Verifica o formulário.";
  if (err.status === 403) return "Registo não permitido. Contacta o administrador.";
  if (err.status === 404) return "Serviço não encontrado.";
  if (err.status === 429) return "Demasiados pedidos. Espera um momento.";
  if (err.status === 401) return "Email ou password incorretos.";

  return err.message || "Ocorreu um erro inesperado";
}
