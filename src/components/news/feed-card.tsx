"use client";

import { memo } from "react";
import type { FeedItem } from "@/lib/news-types";
import { CATEGORY_COLORS } from "@/lib/news-types";
import type { FontSize } from "@/hooks/use-font-size";

const ARABIC_RE = /[\u0600-\u06FF]/;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const FONT_CLASSES: Record<FontSize, { title: string; snippet: string }> = {
  small: { title: "text-sm", snippet: "text-xs" },
  medium: { title: "text-base", snippet: "text-sm" },
  large: { title: "text-lg", snippet: "text-base" },
  xlarge: { title: "text-xl", snippet: "text-lg" },
};

interface FeedCardProps {
  item: FeedItem;
  isNew: boolean;
  fontSize: FontSize;
}

export const FeedCard = memo(function FeedCard({
  item,
  isNew,
  fontSize,
}: FeedCardProps) {
  const isRtl = ARABIC_RE.test(item.title);
  const fonts = FONT_CLASSES[fontSize];
  const accentColor = item.sourceColor || CATEGORY_COLORS[item.sourceCategory];

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative block rounded-sm border bg-card p-4 transition-shadow hover:shadow-md overflow-hidden ${
        isNew ? "animate-in fade-in-0 slide-in-from-bottom-2 duration-300" : ""
      }`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 bottom-0 start-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />

      {/* Source + time */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-sm"
          style={{
            backgroundColor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          {item.source}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {timeAgo(item.pubDate)}
        </span>
      </div>

      {/* Content row */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className={`${fonts.title} font-semibold leading-snug line-clamp-2 mb-1`}
          >
            {item.title}
          </h3>
          {item.snippet && (
            <p
              className={`${fonts.snippet} text-muted-foreground line-clamp-2`}
            >
              {item.snippet}
            </p>
          )}
        </div>
        {item.image && (
          <img
            src={item.image}
            alt=""
            className="w-20 h-20 rounded-sm object-cover shrink-0"
            loading="lazy"
          />
        )}
      </div>
    </a>
  );
});

export function FeedCardSkeleton() {
  return (
    <div className="rounded-sm border bg-card p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-20 bg-muted rounded-sm" />
        <div className="h-4 w-8 bg-muted rounded-sm ms-auto" />
      </div>
      <div className="h-5 w-3/4 bg-muted rounded-sm mb-2" />
      <div className="h-4 w-full bg-muted rounded-sm" />
    </div>
  );
}
