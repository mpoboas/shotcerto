import { pb, type ReactionRecord, type ReactionType } from "./pocketbase";

export interface ReactionSummary {
  likes: number;
  dislikes: number;
  mine: ReactionType | null;
  enabled: boolean;
}

export async function fetchReactionSummary(
  submissionId: string,
  userId?: string,
): Promise<ReactionSummary> {
  try {
    const items = await pb
      .collection("reactions")
      .getFullList<ReactionRecord>({
        filter: pb.filter("submission_id = {:id}", { id: submissionId }),
      });
    let likes = 0;
    let dislikes = 0;
    let mine: ReactionType | null = null;
    for (const r of items) {
      if (r.type === "like") likes++;
      else if (r.type === "dislike") dislikes++;
      if (userId && r.user_id === userId) mine = r.type;
    }
    return { likes, dislikes, mine, enabled: true };
  } catch {
    return { likes: 0, dislikes: 0, mine: null, enabled: false };
  }
}

export async function setReaction(
  submissionId: string,
  type: ReactionType,
): Promise<ReactionSummary> {
  const userId = pb.authStore.record?.id;
  if (!userId) throw new Error("Sessão expirada");

  const existing = await pb
    .collection("reactions")
    .getFullList<ReactionRecord>({
      filter: pb.filter(
        "submission_id = {:sub} && user_id = {:user}",
        { sub: submissionId, user: userId },
      ),
    });

  const current = existing[0];
  if (current?.type === type) {
    await pb.collection("reactions").delete(current.id);
  } else {
    if (current) await pb.collection("reactions").delete(current.id);
    await pb.collection("reactions").create({
      submission_id: submissionId,
      user_id: userId,
      type,
    });
  }

  return fetchReactionSummary(submissionId, userId);
}

