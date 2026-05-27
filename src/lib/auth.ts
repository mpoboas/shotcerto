import { pb } from "./pocketbase";

const USERS_COLLECTION = "users";

/** Garante token PocketBase válido antes de pedidos externos (ex.: presign). */
export async function ensureAuthToken(): Promise<string> {
  if (!pb.authStore.isValid) {
    throw new Error("Sessão expirada. Inicia sessão novamente.");
  }
  try {
    await pb.collection(USERS_COLLECTION).authRefresh();
  } catch {
    pb.authStore.clear();
    throw new Error("Sessão expirada. Inicia sessão novamente.");
  }
  const token = pb.authStore.token?.trim();
  if (!token) {
    throw new Error("Token de autenticação em falta. Inicia sessão novamente.");
  }
  return token;
}
