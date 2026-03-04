import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      <div className="container mx-auto px-4 py-6">
        <p className="text-sm text-white/70 text-center max-w-2xl mx-auto">
          {t("disclaimer")}
        </p>
        <p className="text-xs text-white/40 text-center mt-2">
          {t("appName")} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
