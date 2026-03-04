import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/disclaimer";
import { Phone, Home, Heart, ArrowLeft, ArrowRight, BadgeCheck } from "lucide-react";
import { GOVERNMENT_HOTLINES } from "@/lib/constants";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  // Show first 3 hotline regions as preview
  const previewHotlines = GOVERNMENT_HOTLINES.slice(0, 3);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">

      {/* ── [ 01 ] HERO ──────────────────────────────────────── */}
      <section className="py-12 md:py-20 text-center">
        <p className="brand-section-number mb-4 tracking-[0.2em]">[ 01 ]</p>
        <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-widest mb-3 text-secondary leading-tight">
          {tc("appName")}
        </h1>
        <p className="text-lg md:text-xl font-semibold text-foreground mb-2 uppercase tracking-wide">
          {t("heroTitle")}
        </p>
        <p className="text-muted-foreground mb-10 max-w-md mx-auto">
          {t("heroSubtitle")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Button
            size="lg"
            className="flex-1 gap-2 text-base font-bold min-h-16 py-4 uppercase tracking-wide rounded-sm"
            asChild
          >
            <Link href="/listings">
              <Home className="h-5 w-5 shrink-0" />
              {t("needShelter")}
            </Link>
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="flex-1 gap-2 text-base font-bold min-h-16 py-4 uppercase tracking-wide rounded-sm"
            asChild
          >
            <Link href="/offer">
              <Heart className="h-5 w-5 shrink-0" />
              {t("haveShelter")}
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="border-t border-border mb-12" />

      {/* ── [ 02 ] NOTICE ─────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto mb-12">
        <p className="brand-section-number mb-3 tracking-[0.2em]">[ 02 ]</p>
        <Disclaimer />
      </section>

      {/* ── [ 03 ] EMERGENCY HOTLINES ─────────────────────────── */}
      <section className="max-w-2xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="brand-section-number tracking-[0.2em]">[ 03 ]</p>
            <h2 className="text-xl font-bold uppercase tracking-wide text-secondary mt-1">
              {t("emergencyHotlines")}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-primary hover:text-primary/80 hover:bg-muted font-semibold text-xs uppercase tracking-wide"
            asChild
          >
            <Link href="/hotlines">
              {t("viewAllHotlines")}
              <Arrow className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {previewHotlines.map((hotline) => (
            <Card key={hotline.region} className="rounded-sm border-border">
              <CardContent className="px-3 py-2">
                <p className="font-semibold text-sm mb-1 text-secondary uppercase tracking-wide">
                  {locale === "ar" ? hotline.nameAr : hotline.nameEn}
                </p>
                {hotline.numbers.map((num) => (
                  <a
                    key={num.number}
                    href={`tel:${num.number.replace(/[\s]/g, "")}`}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    <span dir="ltr">{num.number}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── [ 04 ] HOW IT WORKS ───────────────────────────────── */}
      <section className="max-w-2xl mx-auto">
        <p className="brand-section-number mb-3 tracking-[0.2em]">[ 04 ]</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 bg-muted rounded-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className="h-5 w-5 text-secondary shrink-0" />
              <span className="font-bold text-sm uppercase tracking-wide text-secondary">
                {tc("verified")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "إعلانات موثقة من البلديات"
                : "Municipality verified listings"}
            </p>
          </div>
          <div className="p-4 bg-muted rounded-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-5 w-5 text-primary shrink-0" />
              <span className="font-bold text-sm uppercase tracking-wide text-secondary">
                {locale === "ar" ? "اتصال مباشر" : "Direct Contact"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "اتصل مباشرة أو واتساب"
                : "Direct call or WhatsApp"}
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
