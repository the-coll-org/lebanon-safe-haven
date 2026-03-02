"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGION_LIST } from "@/lib/constants";

interface RegionFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function RegionFilter({ value, onChange }: RegionFilterProps) {
  const t = useTranslations("listings");
  const tr = useTranslations("regions");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("filterByRegion")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("allRegions")}</SelectItem>
        {REGION_LIST.map((region) => (
          <SelectItem key={region} value={region}>
            {tr(region)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
