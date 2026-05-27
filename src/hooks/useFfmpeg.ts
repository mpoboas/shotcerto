import { useCallback, useEffect, useRef, useState } from "react";
import { loadFfmpeg } from "../lib/ffmpeg";

type Status = "idle" | "loading" | "ready" | "error";

export function useFfmpeg(autoLoad = true) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      await loadFfmpeg();
      if (mountedRef.current) setStatus("ready");
    } catch (err) {
      if (mountedRef.current) {
        setStatus("error");
        const message =
          typeof err === "string"
            ? err
            : err instanceof Error
              ? err.message
              : "Falha a carregar FFmpeg";
        setError(message);
      }
    }
  }, []);

  useEffect(() => {
    if (autoLoad && status === "idle") {
      void start();
    }
  }, [autoLoad, status, start]);

  return { status, error, start } as const;
}
