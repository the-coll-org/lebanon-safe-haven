import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="border-t bg-muted/50 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">
          {t("disclaimer")}
        </p>
        <p className="text-xs text-muted-foreground/60 text-center mt-2">
          {t("appName")} &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
