import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { pb, type UserRecord } from "../lib/pocketbase";
import { pbUserToProfile, type PbUserRecord } from "../lib/users";

export type RegisterInput = {
  email: string;
  password: string;
  passwordConfirm: string;
  displayName: string;
  avatarFile?: File;
};

interface AuthContextValue {
  user: UserRecord | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(): UserRecord | null {
  const model = pb.authStore.record;
  if (!model) return null;
  return pbUserToProfile(model as PbUserRecord);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(readUser);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setUser(readUser());
    });
    if (pb.authStore.isValid) {
      pb.collection("users")
        .authRefresh()
        .catch(() => pb.authStore.clear())
        .finally(() => setIsReady(true));
    } else {
      setIsReady(true);
    }
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await pb.collection("users").authWithPassword(email, password);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const email = input.email.trim();
    const displayName = input.displayName.trim();
    const body = new FormData();
    body.append("email", email);
    body.append("password", input.password);
    body.append("passwordConfirm", input.passwordConfirm);
    body.append("name", displayName);
    if (input.avatarFile) body.append("avatar", input.avatarFile);
    await pb.collection("users").create(body);
    await pb.collection("users").authWithPassword(email, input.password);
  }, []);

  const logout = useCallback(() => {
    pb.authStore.clear();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isReady,
      login,
      register,
      logout,
    }),
    [user, isReady, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
