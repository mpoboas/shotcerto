import {
  pb,
  type ChallengeRecord,
  type SubmissionRecord,
} from "./pocketbase";

export async function listChallenges(): Promise<ChallengeRecord[]> {
  return pb.collection("challenges").getFullList<ChallengeRecord>({
    sort: "-created",
  });
}

/** Feed global — posts mais recentes primeiro. */
export async function listFeedSubmissions(
  limit = 30,
): Promise<SubmissionRecord[]> {
  const result = await pb.collection("submissions").getList<SubmissionRecord>(
    1,
    limit,
    {
      sort: "-created",
      expand: "user_id,challenge_id",
    },
  );
  return result.items;
}

export async function getChallenge(id: string): Promise<ChallengeRecord> {
  return pb.collection("challenges").getOne<ChallengeRecord>(id);
}

export async function countSubmissions(challengeId: string): Promise<number> {
  const result = await pb.collection("submissions").getList(1, 1, {
    filter: pb.filter("challenge_id = {:id}", { id: challengeId }),
  });
  return result.totalItems;
}

export async function listSubmissionsForChallenge(
  challenge: ChallengeRecord,
  options: { limit?: number; expandUser?: boolean } = {},
): Promise<SubmissionRecord[]> {
  const sort =
    challenge.type === "exact_time" ? "+delta_seconds" : "+duration_seconds";
  const result = await pb
    .collection("submissions")
    .getList<SubmissionRecord>(1, options.limit ?? 50, {
      filter: pb.filter("challenge_id = {:id}", { id: challenge.id }),
      sort,
      expand: options.expandUser ? "user_id" : undefined,
    });
  return result.items;
}

export async function listMySubmissions(
  userId: string,
): Promise<SubmissionRecord[]> {
  const result = await pb
    .collection("submissions")
    .getList<SubmissionRecord>(1, 100, {
      filter: pb.filter("user_id = {:id}", { id: userId }),
      sort: "-created",
      expand: "challenge_id",
    });
  return result.items;
}
