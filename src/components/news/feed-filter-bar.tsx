"use client";

import { useMemo } from "react";
import type { FeedItem, FeedCategory } from "@/lib/news-types";
import { CATEGORY_ORDER, CATEGORY_COLORS } from "@/lib/news-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface FeedFilterBarProps {
  items: FeedItem[];
  activeCategory: FeedCategory | "all";
  onCategoryChange: (cat: FeedCategory | "all") => void;
  activeSource: string | null;
  onSourceChange: (source: string | null) => void;
  hiddenSources: Set<string>;
}

export function FeedFilterBar({
  items,
  activeCategory,
  onCategoryChange,
  activeSource,
  onSourceChange,
  hiddenSources,
}: FeedFilterBarProps) {
  const t = useTranslations("news");

  // Count items per category (excluding hidden sources)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const cat of CATEGORY_ORDER) counts[cat] = 0;

    for (const item of items) {
      if (hiddenSources.has(item.source)) continue;
      counts.all!++;
      counts[item.sourceCategory] = (counts[item.sourceCategory] || 0) + 1;
    }
    return counts;
  }, [items, hiddenSources]);

  // Unique sources for the active category
  const sources = useMemo(() => {
    const map = new Map<
      string,
      { color: string; category: FeedCategory; count: number }
    >();
    for (const item of items) {
      if (hiddenSources.has(item.source)) continue;
      if (activeCategory !== "all" && item.sourceCategory !== activeCategory)
        continue;
      const existing = map.get(item.source);
      if (existing) {
        existing.count++;
      } else {
        map.set(item.source, {
          color:
            item.sourceColor || CATEGORY_COLORS[item.sourceCategory],
          category: item.sourceCategory,
          count: 1,
        });
      }
    }
    return map;
  }, [items, activeCategory, hiddenSources]);

  const categoryKeys: (FeedCategory | "all")[] = ["all", ...CATEGORY_ORDER];
  const categoryLabels: Record<string, string> = {
    all: t("allCategories"),
    war: t("war"),
    breaking: t("breaking"),
    general: t("general"),
  };

  return (
    <div className="space-y-3">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        {categoryKeys.map((cat) => {
          const isActive = activeCategory === cat;
          const color = cat !== "all" ? CATEGORY_COLORS[cat] : undefined;

          return (
            <Button
              key={cat}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs font-medium rounded-sm gap-1.5"
              style={
                isActive && color
                  ? { backgroundColor: color, borderColor: color }
                  : undefined
              }
              onClick={() => {
                onCategoryChange(cat);
                onSourceChange(null);
              }}
            >
              {categoryLabels[cat]}
              <span className="opacity-70">
                {categoryCounts[cat] || 0}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Source chips */}
      {sources.size > 0 && (
        <ScrollArea className="w-full" dir="ltr">
          <div className="flex gap-1.5 pb-2">
            {activeSource && (
              <Badge
                variant="outline"
                className="cursor-pointer h-7 gap-1 shrink-0 hover:bg-destructive/10"
                onClick={() => onSourceChange(null)}
              >
                <X className="h-3 w-3" />
                {t("clearFilter")}
              </Badge>
            )}
            {[...sources.entries()].map(([name, info]) => (
              <Badge
                key={name}
                variant={activeSource === name ? "default" : "outline"}
                className="cursor-pointer h-7 gap-1.5 shrink-0 whitespace-nowrap"
                style={
                  activeSource === name
                    ? { backgroundColor: info.color, borderColor: info.color }
                    : undefined
                }
                onClick={() =>
                  onSourceChange(activeSource === name ? null : name)
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                {name}
                <span className="opacity-60">{info.count}</span>
              </Badge>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
