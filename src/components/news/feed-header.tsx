"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutGrid,
  List,
  ALargeSmall,
  Settings,
  Rss,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { FontSize } from "@/hooks/use-font-size";

interface FeedHeaderProps {
  sources: number;
  articleCount: number;
  fetchedAt: string;
  isStreaming: boolean;
  layout: "grid" | "list";
  onToggleLayout: () => void;
  fontSize: FontSize;
  fontSizeLabel: string;
  onCycleFontSize: () => void;
  onOpenSettings: () => void;
}

export function FeedHeader({
  sources,
  articleCount,
  fetchedAt,
  isStreaming,
  layout,
  onToggleLayout,
  fontSizeLabel,
  onCycleFontSize,
  onOpenSettings,
}: FeedHeaderProps) {
  const t = useTranslations("news");

  const formattedTime = fetchedAt
    ? new Date(fetchedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isStreaming ? "bg-green-500 animate-pulse" : "bg-green-500"
            }`}
          />
          <Rss className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Stats */}
        <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-2">
          <span>
            {sources} {t("sources")}
          </span>
          <span className="text-border">|</span>
          <span>
            {articleCount} {t("articles")}
          </span>
          {formattedTime && (
            <>
              <span className="text-border">|</span>
              <span>
                {t("updated")} {formattedTime}
              </span>
            </>
          )}
        </div>
        {/* Mobile: just article count */}
        <span className="text-xs text-muted-foreground sm:hidden">
          {articleCount} {t("articles")}
        </span>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onToggleLayout}
            >
              {layout === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("layout")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onCycleFontSize}
            >
              <span className="relative">
                <ALargeSmall className="h-4 w-4" />
                <span className="absolute -bottom-1 -end-1 text-[8px] font-bold">
                  {fontSizeLabel}
                </span>
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("fontSize")}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onOpenSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("settings")}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
