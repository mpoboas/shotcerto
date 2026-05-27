import { useEffect, useState } from "react";
import { TopBar } from "../components/TopBar";
import { FeedPostCard } from "../components/FeedPostCard";
import { PageLoader } from "../components/PageLoader";
import { listFeedSubmissions } from "../lib/queries";
import { type SubmissionRecord } from "../lib/pocketbase";

export function Home() {
  const [posts, setPosts] = useState<SubmissionRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listFeedSubmissions(40)
      .then((items) => {
        if (active) setPosts(items);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Erro");
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <>
        <TopBar />
        <p className="px-4 py-8 text-center text-sm text-red-400">{error}</p>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <div className="flex flex-1 flex-col">
        {!posts ? (
          <PageLoader />
        ) : posts.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted2">
            Ainda não há posts. Sê o primeiro em Submeter.
          </p>
        ) : (
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <FeedPostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
