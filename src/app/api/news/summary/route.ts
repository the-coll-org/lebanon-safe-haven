import type { NextRequest } from "next/server";
import type { FeedItem, StreamMessage } from "@/lib/news-types";

const UPSTREAM_URL = "https://lebmonitor.com/api/feeds";
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

type CacheEntry = { text: string; generatedAt: string };
const cache = new Map<string, { data: CacheEntry; expiry: number }>();

async function fetchFeedItems(): Promise<FeedItem[]> {
  const res = await fetch(UPSTREAM_URL, {
    headers: { "User-Agent": "SafeHaven/1.0" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok || !res.body) return [];

  const text = await res.text();
  const items: FeedItem[] = [];

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const msg: StreamMessage = JSON.parse(line);
      if (msg.type === "batch") items.push(...msg.items);
    } catch {
      // skip malformed
    }
  }

  items.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  return items.slice(0, 40);
}

async function generateSummary(
  items: FeedItem[],
  lang: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const headlines = items
    .map(
      (item, i) =>
        `${i + 1}. [${item.source}] ${item.title} (${new Date(item.pubDate).toLocaleDateString()})`
    )
    .join("\n");

  const langInstruction =
    lang === "ar"
      ? "Write in Arabic (العربية). Use formal Modern Standard Arabic."
      : "Write in English.";

  const prompt = `Below are the latest ${items.length} headlines from Lebanese news sources. Write 3-4 bullet points summarizing the current situation. One sentence per bullet. Factual and neutral. ${langInstruction}

${headlines}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "Summary unavailable.";
  return text;
}

export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang") === "ar" ? "ar" : "en";

  // Return cached if fresh
  const cached = cache.get(lang);
  if (cached && Date.now() < cached.expiry) {
    return Response.json(cached.data, {
      headers: {
        "Cache-Control": `public, max-age=${Math.floor((cached.expiry - Date.now()) / 1000)}`,
      },
    });
  }

  try {
    const items = await fetchFeedItems();
    if (items.length === 0) {
      return Response.json(
        {
          text:
            lang === "ar"
              ? "لا تتوفر عناوين حديثة."
              : "No recent headlines available.",
          generatedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    const text = await generateSummary(items, lang);
    const generatedAt = new Date().toISOString();
    const data: CacheEntry = { text, generatedAt };

    cache.set(lang, { data, expiry: Date.now() + CACHE_TTL });

    return Response.json(data, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    console.error("News summary error:", err);

    // Return stale cache if available
    if (cached) {
      return Response.json(cached.data, {
        headers: { "Cache-Control": "public, max-age=60" },
      });
    }

    return Response.json(
      { error: "Failed to generate summary" },
      { status: 502 }
    );
  }
}
