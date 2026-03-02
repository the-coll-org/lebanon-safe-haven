"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  url?: string;
  title?: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const t = useTranslations("common");

  async function handleShare() {
    const shareUrl = url || window.location.href;
    const shareTitle = title || t("appName");

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("copiedLink"));
    }
  }

  return (
    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
      <Share2 className="h-3.5 w-3.5" />
      {t("share")}
    </Button>
  );
}
