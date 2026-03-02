import type { Region, RegionHotline, ListingCategory } from "@/types";

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

export const REGION_CENTERS: Record<Region, [number, number]> = {
  beirut: [33.8938, 35.5018],
  mount_lebanon: [33.8100, 35.5900],
  north_lebanon: [34.4367, 35.8497],
  akkar: [34.5294, 36.0781],
  bekaa: [33.8463, 35.9019],
  baalbek_hermel: [34.0047, 36.2110],
  south_lebanon: [33.3750, 35.4856],
  nabatieh: [33.3772, 35.4836],
};

export const LEBANON_CENTER: [number, number] = [33.8547, 35.8623];
export const LEBANON_DEFAULT_ZOOM = 9;

export const LISTING_STATUSES = ["available", "limited", "full"] as const;

export const LISTING_CATEGORIES: ListingCategory[] = [
  "shelter",
  "food",
  "appliances",
  "clothing",
];

export const CATEGORY_LIST = LISTING_CATEGORIES;
