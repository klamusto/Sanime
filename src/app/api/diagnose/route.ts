import type { NextRequest } from "next/server";
import { getEpisode } from "@/lib/animetom";
import { normalizeServers } from "@/lib/servers";
import { SITE_URL, UPSTREAM_SITE, BROWSER_UA, upstreamHeaders } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Playback doctor — `/api/diagnose?slug=one-piece&ep=1100`.
 *
 * For every source of an episode it reports, in one place:
 *   • what the browser sees when it asks the CDN directly (status + CORS)
 *   • what our server sees when it impersonates the upstream site
 *   • whether the host allows being framed
 *
 * That's the difference between "this server is dead" and "this server just
 * doesn't like my domain", which is what makes these clones hard to debug.
 */
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const ep = Number(req.nextUrl.searchParams.get("ep") || "1");
  if (!slug) {
    return Response.json(
      { success: false, message: "usage: /api/diagnose?slug=<anime>&ep=<number>" },
      { status: 400 }
    );
  }

  let servers;
  try {
    const { episode } = await getEpisode(slug, ep);
    servers = normalizeServers(episode);
  } catch (error) {
    return Response.json(
      { success: false, message: (error as Error).message },
      { status: 502 }
    );
  }

  const report = await Promise.all(
    servers.map(async (s) => {
      const asBrowser = await peek(s.direct, {
        "User-Agent": BROWSER_UA,
        Accept: "*/*",
        Origin: SITE_URL,
        Range: "bytes=0-1",
      });
      const asUpstream = await peek(s.direct, upstreamHeaders({ range: "bytes=0-1" }));

      const acao = asBrowser.headers?.["access-control-allow-origin"] ?? null;
      const xfo = asUpstream.headers?.["x-frame-options"] ?? null;

      return {
        server: s.label,
        host: s.host,
        kind: s.kind,
        url: s.direct,
        browserDirect: {
          status: asBrowser.status,
          error: asBrowser.error,
          cors: acao,
          playableDirectly:
            !!asBrowser.status &&
            asBrowser.status < 400 &&
            (acao === "*" || acao === SITE_URL),
        },
        viaSanimeRelay: {
          status: asUpstream.status,
          error: asUpstream.error,
          worksWithUpstreamReferer: !!asUpstream.status && asUpstream.status < 400,
        },
        framing: { xFrameOptions: xfo },
        verdict: verdict(asBrowser.status, asUpstream.status, acao),
      };
    })
  );

  return Response.json(
    {
      success: true,
      slug,
      episode: ep,
      identity: { site: SITE_URL, impersonating: UPSTREAM_SITE },
      sources: report,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function verdict(
  direct: number | null,
  relay: number | null,
  acao: string | null
): string {
  if (direct && direct < 400 && (acao === "*" || acao)) {
    return "يعمل مباشرة من المتصفح";
  }
  if (relay && relay < 400) {
    return "محجوب عن النطاقات الأخرى — يعمل عبر وسيط سانيمي";
  }
  return "المصدر نفسه لا يستجيب";
}

async function peek(
  url: string,
  headers: Record<string, string>
): Promise<{
  status: number | null;
  error?: string;
  headers?: Record<string, string>;
}> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers,
    });
    res.body?.cancel().catch(() => undefined);
    const out: Record<string, string> = {};
    for (const key of [
      "access-control-allow-origin",
      "content-type",
      "x-frame-options",
      "content-security-policy",
    ]) {
      const value = res.headers.get(key);
      if (value) out[key] = value;
    }
    return { status: res.status, headers: out };
  } catch (error) {
    return { status: null, error: (error as Error).name };
  }
}
