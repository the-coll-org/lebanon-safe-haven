import { setRequestLocale, getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

// Static data - cache for 24 hours
export const revalidate = 86400;

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

const RESOURCES = [
  {
    key: "unhcr",
    url: "https://www.unhcr.org/lb/",
  },
  {
    key: "redCross",
    url: "https://www.redcross.org.lb/",
  },
  {
    key: "unicef",
    url: "https://www.unicef.org/lebanon/",
  },
  {
    key: "caritas",
    url: "https://www.caritas.org.lb/",
  },
];

export default async function ResourcesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("resources");

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-6">{t("subtitle")}</p>

      <div className="grid gap-4">
        {RESOURCES.map((resource) => (
          <Card key={resource.key}>
            <CardContent className="p-4 flex items-center justify-between">
              <h3 className="font-medium">
                {t(resource.key as "unhcr" | "redCross" | "unicef" | "caritas")}
              </h3>
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("visitWebsite")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
