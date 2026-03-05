export type FeedCategory = "war" | "breaking" | "general";

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  snippet: string;
  pubDate: string;
  source: string;
  sourceColor?: string;
  sourceCategory: FeedCategory;
  image?: string;
}

export type StreamMessage =
  | { type: "batch"; items: FeedItem[]; source: string }
  | { type: "error"; source: string; message: string }
  | { type: "done"; sources: number; errors: string[]; fetchedAt: string };

export const CATEGORY_ORDER: FeedCategory[] = ["war", "breaking", "general"];

export const CATEGORY_COLORS: Record<FeedCategory, string> = {
  war: "#dc2626",
  breaking: "#ea580c",
  general: "#2563eb",
};
