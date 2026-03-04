import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getListings } from "@/lib/data";
import { ListingsClient } from "@/components/listings-client";

// Revalidate the page every 60 seconds (ISR)
export const revalidate = 60;

// Generate static params for locales
export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default async function ListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("listings");

  const listings = await getListings();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>

      <ListingsClient initialListings={listings} />
    </div>
  );
}

export const dynamicParams = true;
