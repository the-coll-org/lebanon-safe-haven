import type { FeedItem, StreamMessage } from "@/lib/news-types";

const UPSTREAM_URL = "https://lebmonitor.com/api/feeds";
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

let cachedSummary: { text: string; generatedAt: string } | null = null;
let cacheExpiry = 0;

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

  // Sort by date, take top 40
  items.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  return items.slice(0, 40);
}

async function generateSummary(items: FeedItem[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const headlines = items
    .map(
      (item, i) =>
        `${i + 1}. [${item.source}] ${item.title} (${new Date(item.pubDate).toLocaleDateString()})`
    )
    .join("\n");

  const prompt = `Below are the latest ${items.length} headlines from Lebanese news sources. Write 3-4 bullet points summarizing the current situation. One sentence per bullet. Factual and neutral. English only.

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

export async function GET() {
  // Return cached if fresh
  if (cachedSummary && Date.now() < cacheExpiry) {
    return Response.json(cachedSummary, {
      headers: {
        "Cache-Control": `public, max-age=${Math.floor((cacheExpiry - Date.now()) / 1000)}`,
      },
    });
  }

  try {
    const items = await fetchFeedItems();
    if (items.length === 0) {
      return Response.json(
        { text: "No recent headlines available.", generatedAt: new Date().toISOString() },
        { status: 200 }
      );
    }

    const text = await generateSummary(items);
    const generatedAt = new Date().toISOString();

    cachedSummary = { text, generatedAt };
    cacheExpiry = Date.now() + CACHE_TTL;

    return Response.json(cachedSummary, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    console.error("News summary error:", err);

    // Return stale cache if available
    if (cachedSummary) {
      return Response.json(cachedSummary, {
        headers: { "Cache-Control": "public, max-age=60" },
      });
    }

    return Response.json(
      { error: "Failed to generate summary" },
      { status: 502 }
    );
  }
}
