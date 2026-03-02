import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/disclaimer";
import { Phone, Home, Heart, ArrowLeft, ArrowRight } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center py-12 md:py-20">
        <div className="flex justify-center mb-4">
          <Heart className="h-12 w-12 text-primary fill-primary" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
          {tc("appName")}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-2">
          {t("heroTitle")}
        </p>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {t("heroSubtitle")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          <Button size="lg" className="flex-1 gap-2 text-lg min-h-16 py-4" asChild>
            <Link href="/listings">
              <Home className="h-5 w-5" />
              {t("needShelter")}
            </Link>
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="flex-1 gap-2 text-lg min-h-16 py-4"
            asChild
          >
            <Link href="/offer">
              <Heart className="h-5 w-5" />
              {t("haveShelter")}
            </Link>
          </Button>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-2xl mx-auto mb-12">
        <Disclaimer />
      </section>

      {/* Emergency Hotlines Preview */}
      <section className="max-w-2xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t("emergencyHotlines")}</h2>
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <Link href="/hotlines">
              {t("viewAllHotlines")}
              <Arrow className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {previewHotlines.map((hotline) => (
            <Card key={hotline.region}>
              <CardContent className="px-3 py-2">
                <p className="font-medium text-sm mb-1">
                  {locale === "ar" ? hotline.nameAr : hotline.nameEn}
                </p>
                {hotline.numbers.map((num) => (
                  <a
                    key={num.number}
                    href={`tel:${num.number.replace(/[\s]/g, "")}`}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
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

      {/* Quick info */}
      <section className="max-w-2xl mx-auto">
        <div className="grid gap-4 sm:grid-cols-3 text-center">
          <div className="p-4 rounded-lg bg-muted/50">
            <Badge variant="default" className="bg-blue-600 mb-1">
              {tc("verified")}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              {locale === "ar"
                ? "أماكن موثقة من البلديات"
                : "Municipality verified spaces"}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <Phone className="h-6 w-6 mx-auto mb-1 text-green-600" />
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
