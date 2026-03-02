import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";

export function Disclaimer() {
  const t = useTranslations("common");

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
      <div className="flex items-start gap-2">
        <TriangleAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}
