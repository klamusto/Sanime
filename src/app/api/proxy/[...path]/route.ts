import type { NextRequest } from "next/server";
import { API_BASE, upstreamHeaders } from "@/lib/config";

const UPSTREAM = API_BASE;
const TIMEOUT = 15_000;

/**
 * Server-side proxy used by client components (search suggestions, etc.).
 * Keeps upstream details off the browser and adds short-term shared caching.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const url = new URL(req.url);
  const target = `${UPSTREAM}/${path.map(encodeURIComponent).join("/")}${url.search}`;

  try {
    const res = await fetch(target, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: upstreamHeaders({ accept: "application/json" }),
    });

    if (!res.ok) {
      return Response.json(
        { success: false, message: `Upstream error ${res.status}` },
        { status: res.status }
      );
    }

    const body = await res.text();
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return Response.json(
      { success: false, message: "Upstream unreachable" },
      { status: 502 }
    );
  }
}
