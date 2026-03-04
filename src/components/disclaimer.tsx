import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";

export function Disclaimer() {
  const t = useTranslations("common");

  return (
    <div className="border border-destructive/30 bg-destructive/5 p-3 rounded-sm">
      <div className="flex items-start gap-2">
        <TriangleAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
        <p className="text-sm text-destructive/90">
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}
