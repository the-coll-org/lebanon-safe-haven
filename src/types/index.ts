export type Region =
  | "mount_lebanon"
  | "beirut"
  | "south_lebanon"
  | "nabatieh"
  | "bekaa"
  | "baalbek_hermel"
  | "akkar"
  | "north_lebanon";

export type ListingStatus = "available" | "limited" | "full";

export type ListingCategory = "shelter" | "food" | "appliances" | "clothing";

export interface Listing {
  id: string;
  phone: string;
  region: Region;
  category: ListingCategory;
  area: string | null;
  capacity: number;
  description: string | null;
  status: ListingStatus;
  editToken: string;
  verified: boolean;
  verifiedBy: string | null;
  flagCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AdminRole = "superadmin" | "municipality";

export interface Municipality {
  id: string;
  name: string;
  region: Region;
  role: AdminRole;
  username: string;
  createdAt: string;
}

export interface Flag {
  id: string;
  listingId: string;
  reason: string | null;
  createdAt: string;
}

export interface HotlineNumber {
  number: string;
  label?: string;
}

export interface RegionHotline {
  region: Region;
  nameAr: string;
  nameEn: string;
  numbers: HotlineNumber[];
}
