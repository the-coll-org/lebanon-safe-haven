"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const newLocale = locale === "ar" ? "en" : "ar";

  return (
    <Button variant="ghost" size="sm" className="font-semibold" asChild>
      <Link href={pathname} locale={newLocale}>
        {locale === "ar" ? "EN" : "عربي"}
      </Link>
    </Button>
  );
}
