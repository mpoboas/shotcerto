import { pb, type CommentRecord } from "./pocketbase";

export interface CommentThread {
  comment: CommentRecord;
  replies: CommentRecord[];
}

export async function countComments(submissionId: string): Promise<number> {
  try {
    const result = await pb.collection("comments").getList(1, 1, {
      filter: pb.filter("submission_id = {:id}", { id: submissionId }),
    });
    return result.totalItems;
  } catch {
    return 0;
  }
}

export async function listCommentThreads(
  submissionId: string,
): Promise<CommentThread[]> {
  try {
    const items = await pb.collection("comments").getFullList<CommentRecord>({
      filter: pb.filter("submission_id = {:id}", { id: submissionId }),
      sort: "created",
      expand: "user_id",
    });

    const topLevel = items
      .filter((c) => !c.parent_id)
      .sort(
        (a, b) =>
          new Date(b.created).getTime() - new Date(a.created).getTime(),
      );

    const repliesByParent = new Map<string, CommentRecord[]>();
    for (const c of items) {
      if (!c.parent_id) continue;
      const list = repliesByParent.get(c.parent_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    }

    return topLevel.map((comment) => ({
      comment,
      replies: (repliesByParent.get(comment.id) ?? []).sort(
        (a, b) =>
          new Date(a.created).getTime() - new Date(b.created).getTime(),
      ),
    }));
  } catch {
    return [];
  }
}

export async function addComment(
  submissionId: string,
  body: string,
  parentId?: string,
): Promise<CommentRecord> {
  const userId = pb.authStore.record?.id;
  if (!userId) throw new Error("Sessão expirada");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comentário vazio");
  if (trimmed.length > 500) throw new Error("Comentário demasiado longo");

  const payload: Record<string, unknown> = {
    submission_id: submissionId,
    user_id: userId,
    body: trimmed,
  };
  if (parentId) payload.parent_id = parentId;

  try {
    return await pb.collection("comments").create<CommentRecord>(payload);
  } catch {
    if (!parentId) throw new Error("Não foi possível comentar");
    delete payload.parent_id;
    return pb.collection("comments").create<CommentRecord>(payload);
  }
}
