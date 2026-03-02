import { setRequestLocale, getTranslations } from "next-intl/server";
import { OfferForm } from "@/components/offer-form";

export default async function OfferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("offer");

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-6">{t("subtitle")}</p>
      <OfferForm />
    </div>
  );
}
