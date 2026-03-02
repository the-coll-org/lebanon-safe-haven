"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LISTING_CATEGORIES } from "@/lib/constants";

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const t = useTranslations("listings");
  const tcat = useTranslations("categories");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("filterByCategory")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("allCategories")}</SelectItem>
        {LISTING_CATEGORIES.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {tcat(cat)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
