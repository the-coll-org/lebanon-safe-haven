"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedItem, StreamMessage } from "@/lib/news-types";

const REFRESH_INTERVAL = 30_000;
const NEW_BADGE_DURATION = 600;

export function useFeedStream() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [sources, setSources] = useState(0);
  const [fetchedAt, setFetchedAt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const existingIds = useRef(new Set<string>());
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFeeds = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);
    if (items.length === 0) setIsLoading(true);

    try {
      const res = await fetch("/api/news", { signal: controller.signal });
      if (!res.ok || !res.body) {
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg: StreamMessage = JSON.parse(line);

            if (msg.type === "batch") {
              const fresh = msg.items.filter(
                (item) => !existingIds.current.has(item.id)
              );
              if (fresh.length === 0) continue;

              for (const item of fresh) existingIds.current.add(item.id);

              setItems((prev) => {
                const merged = [...prev, ...fresh];
                merged.sort(
                  (a, b) =>
                    new Date(b.pubDate).getTime() -
                    new Date(a.pubDate).getTime()
                );
                return merged;
              });

              // Mark new items for animation
              if (items.length > 0) {
                const ids = new Set(fresh.map((i) => i.id));
                setNewIds((prev) => new Set([...prev, ...ids]));
                setTimeout(() => {
                  setNewIds((prev) => {
                    const next = new Set(prev);
                    for (const id of ids) next.delete(id);
                    return next;
                  });
                }, NEW_BADGE_DURATION);
              }
            } else if (msg.type === "done") {
              setSources(msg.sources);
              setFetchedAt(msg.fetchedAt);
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchFeeds();

    timerRef.current = setInterval(fetchFeeds, REFRESH_INTERVAL);

    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchFeeds]);

  return { items, newIds, sources, fetchedAt, isLoading, isStreaming };
}
