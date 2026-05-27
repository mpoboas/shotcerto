import PocketBase from "pocketbase";
import type { VesselType } from "./drinks";

const url = import.meta.env.VITE_POCKETBASE_URL;
if (!url) {
  throw new Error("VITE_POCKETBASE_URL não está definido");
}

export const pb = new PocketBase(url);
pb.autoCancellation(false);

export type ChallengeType = "exact_time" | "speed_run";
export type QuantityUnit = VesselType;

export interface ChallengeRecord {
  id: string;
  title: string;
  type: ChallengeType;
  drink_type?: string;
  quantity?: number;
  quantity_unit?: QuantityUnit;
  target_seconds?: number;
  description?: string;
  slug?: string;
  is_catalog?: boolean;
  created_by?: string;
  created: string;
  updated: string;
}

export type ReactionType = "like" | "dislike";

export interface ReactionRecord {
  id: string;
  submission_id: string;
  user_id: string;
  type: ReactionType;
  created: string;
}

export interface CommentRecord {
  id: string;
  submission_id: string;
  user_id: string;
  body: string;
  parent_id?: string;
  created: string;
  expand?: {
    user_id?: UserRecord;
    parent_id?: CommentRecord;
  };
}

export interface SubmissionRecord {
  id: string;
  challenge_id: string;
  user_id: string;
  video_r2_key: string;
  video_url: string;
  duration_seconds: number;
  range_start_seconds?: number;
  range_end_seconds?: number;
  delta_seconds?: number;
  created: string;
  updated: string;
  expand?: {
    user_id?: UserRecord;
    challenge_id?: ChallengeRecord;
  };
}

export interface UserRecord {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
}
