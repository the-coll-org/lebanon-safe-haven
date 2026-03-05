"use client";

import { useMemo } from "react";
import type { FeedItem, FeedCategory } from "@/lib/news-types";
import { CATEGORY_ORDER, CATEGORY_COLORS } from "@/lib/news-types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from "next-intl";

interface SourceInfo {
  color: string;
  category: FeedCategory;
  count: number;
}

interface FeedSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: FeedItem[];
  hiddenSources: Set<string>;
  onToggleSource: (source: string) => void;
}

export function FeedSettings({
  open,
  onOpenChange,
  items,
  hiddenSources,
  onToggleSource,
}: FeedSettingsProps) {
  const t = useTranslations("news");

  const sourcesByCategory = useMemo(() => {
    const map = new Map<string, SourceInfo>();
    for (const item of items) {
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

    const grouped: Record<FeedCategory, [string, SourceInfo][]> = {
      war: [],
      breaking: [],
      general: [],
    };

    for (const [name, info] of map) {
      grouped[info.category].push([name, info]);
    }

    return grouped;
  }, [items]);

  const totalSources = Object.values(sourcesByCategory).flat().length;
  const activeSources = totalSources - hiddenSources.size;

  const categoryLabels: Record<FeedCategory, string> = {
    war: t("war"),
    breaking: t("breaking"),
    general: t("general"),
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[320px] sm:w-[380px]">
        <SheetHeader>
          <SheetTitle>{t("settings")}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {t("sourcesActive", {
              count: activeSources,
              total: totalSources,
            })}
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
          <div className="space-y-6 pb-8">
            {CATEGORY_ORDER.map((cat) => {
              const sources = sourcesByCategory[cat];
              if (sources.length === 0) return null;

              return (
                <div key={cat}>
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
                    style={{ color: CATEGORY_COLORS[cat] }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                    />
                    {categoryLabels[cat]}
                  </h3>
                  <div className="space-y-2">
                    {sources.map(([name, info]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: info.color }}
                          />
                          <span className="text-sm truncate">{name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {info.count}
                          </span>
                        </div>
                        <Switch
                          checked={!hiddenSources.has(name)}
                          onCheckedChange={() => onToggleSource(name)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
