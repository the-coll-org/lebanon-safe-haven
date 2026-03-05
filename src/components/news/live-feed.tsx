"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { FeedCategory } from "@/lib/news-types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useFeedStream } from "@/hooks/use-feed-stream";
import { useFeedPrefs } from "@/hooks/use-feed-prefs";
import { useNewsLayout } from "@/hooks/use-news-layout";
import { useFontSize } from "@/hooks/use-font-size";
import { FeedHeader } from "./feed-header";
import { FeedFilterBar } from "./feed-filter-bar";
import { FeedContent } from "./feed-content";
import { FeedSettings } from "./feed-settings";
import { FeedOverview } from "./feed-overview";
import { useTranslations } from "next-intl";

const ITEMS_PER_PAGE = 30;

export function LiveFeed() {
  const t = useTranslations("news");
  const {
    items: allItems,
    newIds,
    sources: sourceCount,
    fetchedAt,
    isLoading,
    isStreaming,
  } = useFeedStream();
  const { prefs, toggleSource, syncSources } = useFeedPrefs();
  const { layout, toggleLayout } = useNewsLayout();
  const { fontSize, label: fontSizeLabel, cycleFontSize } = useFontSize();

  const [activeCategory, setActiveCategory] = useState<FeedCategory | "all">(
    "all"
  );
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Sync discovered sources
  useEffect(() => {
    if (!isStreaming && allItems.length > 0) {
      const names = [...new Set(allItems.map((i) => i.source))];
      syncSources(names);
    }
  }, [isStreaming, allItems, syncSources]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (prefs.hidden.has(item.source)) return false;
      if (activeCategory !== "all" && item.sourceCategory !== activeCategory)
        return false;
      if (activeSource && item.source !== activeSource) return false;
      return true;
    });
  }, [allItems, prefs.hidden, activeCategory, activeSource]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [activeCategory, activeSource]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <FeedHeader
          sources={sourceCount}
          articleCount={filteredItems.length}
          fetchedAt={fetchedAt}
          isStreaming={isStreaming}
          layout={layout}
          onToggleLayout={toggleLayout}
          fontSize={fontSize}
          fontSizeLabel={fontSizeLabel}
          onCycleFontSize={cycleFontSize}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <FeedOverview />

        <FeedFilterBar
          items={allItems}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          activeSource={activeSource}
          onSourceChange={setActiveSource}
          hiddenSources={prefs.hidden}
        />

        <FeedContent
          items={filteredItems}
          newIds={newIds}
          layout={layout}
          fontSize={fontSize}
          visibleCount={visibleCount}
          onLoadMore={loadMore}
          isLoading={isLoading}
        />

        {/* Attribution */}
        <p className="text-center text-xs text-muted-foreground py-4">
          {t("poweredBy")}{" "}
          <a
            href="https://lebmonitor.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            lebmonitor.com
          </a>
        </p>

        <FeedSettings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          items={allItems}
          hiddenSources={prefs.hidden}
          onToggleSource={toggleSource}
        />
      </div>
    </TooltipProvider>
  );
}
