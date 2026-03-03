import { setRequestLocale, getTranslations } from "next-intl/server";
import { FeedbackForm } from "@/components/feedback-form";
import { getSession } from "@/lib/auth";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("feedback");
  
  // Check if user is authenticated
  const session = await getSession();
  const isAuthenticated = !!session;

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-6">{t("subtitle")}</p>
      <FeedbackForm isAuthenticated={isAuthenticated} />
    </div>
  );
}