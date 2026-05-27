import { pb } from "./pocketbase";

/** PocketBase auth record shape (built-in + optional custom fields). */
export type PbUserRecord = {
  id: string;
  username?: string;
  name?: string;
  avatar?: string;
  avatar_url?: string;
  email?: string;
};

export function resolveUsername(record: PbUserRecord): string {
  const value = (record.username ?? record.name ?? "").trim();
  return value || "—";
}

export function resolveAvatarUrl(record: PbUserRecord): string | undefined {
  if (record.avatar_url?.trim()) return record.avatar_url.trim();
  if (record.avatar) {
    return pb.files.getUrl(record, record.avatar);
  }
  return undefined;
}

export function pbUserToProfile(record: PbUserRecord) {
  return {
    id: record.id,
    username: resolveUsername(record),
    avatar_url: resolveAvatarUrl(record),
    email: record.email,
  };
}
