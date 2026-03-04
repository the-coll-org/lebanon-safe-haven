import { setRequestLocale, getTranslations } from "next-intl/server";
import { HotlineCard } from "@/components/hotline-card";
import { Disclaimer } from "@/components/disclaimer";
import { GOVERNMENT_HOTLINES } from "@/lib/constants";

export default async function HotlinesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hotlines");

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-extrabold uppercase tracking-wide mb-2 text-secondary">{t("title")}</h1>
      <p className="text-muted-foreground mb-6">{t("subtitle")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {GOVERNMENT_HOTLINES.map((hotline) => (
          <HotlineCard
            key={hotline.region}
            hotline={hotline}
            locale={locale}
          />
        ))}
      </div>

      <div className="mt-8">
        <Disclaimer />
      </div>
    </div>
  );
}
