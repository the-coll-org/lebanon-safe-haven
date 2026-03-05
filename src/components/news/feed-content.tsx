"use client";

import { useEffect, useRef, useCallback } from "react";
import type { FeedItem } from "@/lib/news-types";
import type { FontSize } from "@/hooks/use-font-size";
import { FeedCard, FeedCardSkeleton } from "./feed-card";
import { useTranslations } from "next-intl";

interface FeedContentProps {
  items: FeedItem[];
  newIds: Set<string>;
  layout: "grid" | "list";
  fontSize: FontSize;
  visibleCount: number;
  onLoadMore: () => void;
  isLoading: boolean;
}

export function FeedContent({
  items,
  newIds,
  layout,
  fontSize,
  visibleCount,
  onLoadMore,
  isLoading,
}: FeedContentProps) {
  const t = useTranslations("news");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && items.length > visibleCount) {
        onLoadMore();
      }
    },
    [items.length, visibleCount, onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: "200px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <FeedCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">{t("noResults")}</p>
      </div>
    );
  }

  const visible = items.slice(0, visibleCount);

  return (
    <div>
      <div
        key={layout}
        className={
          layout === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
            : "max-w-3xl mx-auto flex flex-col gap-3"
        }
      >
        {visible.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            isNew={newIds.has(item.id)}
            fontSize={fontSize}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-8" />

      {visibleCount < items.length && (
        <p className="text-center text-sm text-muted-foreground py-4">
          {t("loadingMore")}
        </p>
      )}

      {visibleCount >= items.length && items.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          {t("endOfFeed")}
        </p>
      )}
    </div>
  );
}
