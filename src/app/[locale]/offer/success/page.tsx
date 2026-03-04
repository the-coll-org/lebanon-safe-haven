"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export default function OfferSuccessPage() {
  const t = useTranslations("offerSuccess");
  const tc = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const editUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/listings/${id}?editToken=${token}`
      : "";

  function copyEditLink() {
    navigator.clipboard.writeText(editUrl);
    toast.success(tc("copiedLink"));
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card className="rounded-sm border-border">
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-2xl font-extrabold uppercase tracking-wide text-secondary">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>

          <div className="text-start space-y-2">
            <Label>{t("editLink")}</Label>
            <div className="flex gap-2">
              <Input value={editUrl} readOnly dir="ltr" className="text-xs" />
              <Button variant="outline" size="icon" onClick={copyEditLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t("editLinkNote")}</p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button className="rounded-sm font-bold uppercase tracking-wide" asChild>
              <Link href={`/listings/${id}`}>
                {t("viewListing")}
              </Link>
            </Button>
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/">{t("backHome")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
