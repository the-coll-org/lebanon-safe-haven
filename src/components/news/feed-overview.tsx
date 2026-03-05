"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

interface Summary {
  text: string;
  generatedAt: string;
}

export function FeedOverview() {
  const t = useTranslations("news");
  const locale = useLocale();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/news/summary?lang=${locale}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.text) setSummary(data);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !summary) return null;

  return (
    <div className="rounded-sm border bg-card p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            {t("aiOverview")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {summary?.generatedAt && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(summary.generatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={fetchSummary}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {isLoading && !summary ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>{t("summaryError")}</span>
        </div>
      ) : (
        <div className="text-sm leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:ps-5 [&_li]:mb-1">
          {summary?.text.split("\n").map((line, i) => {
            if (!line.trim()) return null;
            // Strip leading bullet characters and render as list items
            const cleaned = line.replace(/^[-•*]\s*/, "").trim();
            if (!cleaned) return null;
            return (
              <div key={i} className="flex gap-2 mb-1.5">
                <span className="text-primary mt-1 shrink-0">•</span>
                <span>{cleaned}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
