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

export interface Listing {
  id: string;
  phone: string;
  region: Region;
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

export interface Municipality {
  id: string;
  name: string;
  region: Region;
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
