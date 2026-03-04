"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { CircleOff } from "lucide-react";
import { toast } from "sonner";

interface UnavailableButtonProps {
  listingId: string;
}

const STORAGE_KEY = "reported_unavailable";

function getReported(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function UnavailableButton({ listingId }: UnavailableButtonProps) {
  const t = useTranslations("unavailable");
  const [reported, setReported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const data = getReported();
    const lastReported = data[listingId];
    if (lastReported && Date.now() - lastReported < 24 * 60 * 60 * 1000) {
      setReported(true);
    }
  }, [listingId]);

  async function handleReport() {
    if (reported) {
      toast.info(t("alreadyReported"));
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}/report-unavailable`, {
      method: "POST",
    });

    if (res.ok) {
      toast.success(t("reported"));
      setReported(true);
      const data = getReported();
      data[listingId] = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else if (res.status === 429) {
      toast.info(t("alreadyReported"));
      setReported(true);
    }
    setLoading(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1 text-muted-foreground"
      onClick={handleReport}
      disabled={loading || reported}
    >
      <CircleOff className="h-3.5 w-3.5" />
      {t("reportButton")}
    </Button>
  );
}
