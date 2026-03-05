const UPSTREAM_URL = "https://lebmonitor.com/api/feeds";

export async function GET() {
  const upstream = await fetch(UPSTREAM_URL, {
    headers: { "User-Agent": "SafeHaven/1.0" },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch upstream feeds" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store",
    },
  });
}
