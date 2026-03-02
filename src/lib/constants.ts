import type { Region, RegionHotline } from "@/types";

export const REGIONS: Record<Region, { ar: string; en: string }> = {
  mount_lebanon: { ar: "جبل لبنان", en: "Mount Lebanon" },
  beirut: { ar: "بيروت", en: "Beirut" },
  south_lebanon: { ar: "جنوب لبنان", en: "South Lebanon" },
  nabatieh: { ar: "النبطية", en: "Nabatieh" },
  bekaa: { ar: "البقاع", en: "Bekaa" },
  baalbek_hermel: { ar: "بعلبك - الهرمل", en: "Baalbek-Hermel" },
  akkar: { ar: "عكار", en: "Akkar" },
  north_lebanon: { ar: "شمال لبنان", en: "North Lebanon" },
};

export const REGION_LIST = Object.keys(REGIONS) as Region[];

export const GOVERNMENT_HOTLINES: RegionHotline[] = [
  {
    region: "mount_lebanon",
    nameAr: "جبل لبنان",
    nameEn: "Mount Lebanon",
    numbers: [
      { number: "05-924225" },
      { number: "81-033910" },
    ],
  },
  {
    region: "beirut",
    nameAr: "بيروت",
    nameEn: "Beirut",
    numbers: [
      { number: "01-987001/2" },
      { number: "71-028975" },
    ],
  },
  {
    region: "south_lebanon",
    nameAr: "جنوب لبنان",
    nameEn: "South Lebanon",
    numbers: [
      { number: "07-720081" },
      { number: "81-072619" },
    ],
  },
  {
    region: "nabatieh",
    nameAr: "النبطية",
    nameEn: "Nabatieh",
    numbers: [
      { number: "76-873806" },
    ],
  },
  {
    region: "bekaa",
    nameAr: "البقاع",
    nameEn: "Bekaa",
    numbers: [
      { number: "08-808211" },
      { number: "81-479342" },
    ],
  },
  {
    region: "baalbek_hermel",
    nameAr: "بعلبك - الهرمل",
    nameEn: "Baalbek-Hermel",
    numbers: [
      { number: "71-017261" },
      { number: "81-479343" },
    ],
  },
  {
    region: "akkar",
    nameAr: "عكار",
    nameEn: "Akkar",
    numbers: [
      { number: "79-303476" },
      { number: "79-303470" },
    ],
  },
  {
    region: "north_lebanon",
    nameAr: "شمال لبنان",
    nameEn: "North Lebanon",
    numbers: [
      { number: "06-443120" },
      { number: "79-380421" },
    ],
  },
];

export const LISTING_STATUSES = ["available", "limited", "full"] as const;
