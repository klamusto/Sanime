import { unstable_cache } from "next/cache";
import {
  PROBE_SOURCES,
  SITE_URL,
  BROWSER_UA,
  needsProxy,
  upstreamHeaders,
} from "./config";
import { fetchMedia } from "./fetch-media";
import { proxiedEmbedUrl, proxiedMediaUrl, isPublicHttpUrl } from "./stream-url";
import type { Episode, EpisodeServer } from "./types";

/**
 * Turns the raw upstream `servers[]` blob into something the player can trust.
 *
 * The upstream payload is messy: entries with empty URLs, http-only mirrors,
 * duplicated hosts, R2 links that 401 for foreign referers, embeds that refuse
 * to be framed. Everything is normalised, health-checked and ordered here so
 * the UI only ever offers sources that have a real chance of playing.
 */

export type ServerKind = "hls" | "file" | "embed";
export type ServerHealth = "ok" | "unknown" | "dead";

export interface PlayableServer {
  id: string;
  label: string;
  host: string;
  kind: ServerKind;
  /** What the player loads first. */
  src: string;
  /** Same-origin fallback (media relay / re-framed embed). */
  alt: string;
  /** Original upstream URL — used for "open in a new tab". */
  direct: string;
  /** True when `src` already points at our relay. */
  proxied: boolean;
  quality?: string;
  status: ServerHealth;
  /** Short human hint shown under the player when something is off. */
  note?: string;
}

const QUALITY_RE = /\b(4k|2160p?|1440p?|1080p?|fhd|720p?|hd|480p?|sd|360p?)\b/i;

const HOST_LABELS: Record<string, string> = {
  "mega.nz": "Mega",
  "mega.co.nz": "Mega",
  "drive.google.com": "Google Drive",
  "dailymotion.com": "Dailymotion",
  "videa.hu": "Videa",
  "ok.ru": "OK.ru",
  "mp4upload.com": "Mp4upload",
  "sendvid.com": "Sendvid",
  "vidmoly.to": "Vidmoly",
  "uqload.com": "Uqload",
  "streamtape.com": "Streamtape",
  "4shared.com": "4Shared",
  "youtube.com": "YouTube",
};

function prettyLabel(raw: string, host: string): string {
  const name = (raw || "").trim().replace(/animetom/gi, "Sanime");
  if (name) return name;
  const key = Object.keys(HOST_LABELS).find((h) => host.endsWith(h));
  return key ? HOST_LABELS[key] : host || "سيرفر";
}

function qualityOf(server: EpisodeServer, fallback?: string[]): string | undefined {
  const fromName = server.name?.match(QUALITY_RE)?.[0];
  if (fromName) return normalizeQuality(fromName);
  if (server.qualities?.length) return server.qualities.join(" · ");
  if (fallback?.length) return fallback.join(" · ");
  return undefined;
}

function normalizeQuality(q: string): string {
  const v = q.toUpperCase();
  if (v === "FHD") return "1080p";
  if (v === "HD") return "720p";
  if (v === "SD") return "480p";
  if (/^\d+$/.test(v)) return `${v}p`;
  return v.toLowerCase();
}

function kindOf(url: string): ServerKind {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".m3u8")) return "hls";
  if (/\.(mp4|webm|mkv|mov|m4v)$/.test(path)) return "file";
  return "embed";
}

function qualityWeight(q?: string): number {
  if (!q) return 0;
  const m = q.match(/(\d{3,4})p/);
  return m ? Number(m[1]) : 0;
}

/** Normalise + dedupe, without touching the network. */
export function normalizeServers(episode: Episode): PlayableServer[] {
  const seen = new Set<string>();
  const list: PlayableServer[] = [];

  const raw = [...(episode.servers ?? [])].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  for (const server of raw) {
    let url = (server.url || server.embedUrl || "").trim();
    if (!url) continue; // upstream placeholder with no source at all
    if (url.startsWith("//")) url = `https:${url}`;
    if (!/^https?:\/\//i.test(url)) continue;
    if (!isPublicHttpUrl(url)) continue;

    const dedupeKey = url.replace(/^https?:\/\//, "").toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    let host = "";
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }

    const kind = kindOf(url);
    const insecure = url.startsWith("http://");
    const proxy =
      kind === "embed" ? proxiedEmbedUrl(url) : proxiedMediaUrl(url);
    // http embeds are blocked as mixed content, so they start on the relay.
    const startProxied = kind === "embed" ? insecure : insecure || needsProxy(url);

    list.push({
      id: server._id || `${host}-${list.length}`,
      label: prettyLabel(server.name, host),
      host,
      kind,
      src: startProxied ? proxy : url,
      alt: startProxied ? url : proxy,
      direct: url,
      proxied: startProxied,
      quality: qualityOf(server, episode.qualities),
      status: "unknown",
    });
  }

  return list.sort(rank);
}

function rank(a: PlayableServer, b: PlayableServer): number {
  const health = (s: PlayableServer) =>
    s.status === "ok" ? 0 : s.status === "unknown" ? 1 : 2;
  if (health(a) !== health(b)) return health(a) - health(b);
  const kindScore = (s: PlayableServer) =>
    s.kind === "hls" ? 0 : s.kind === "file" ? 1 : 2;
  if (kindScore(a) !== kindScore(b)) return kindScore(a) - kindScore(b);
  return qualityWeight(b.quality) - qualityWeight(a.quality);
}

/* ------------------------------------------------------------------ */
/* Health checks                                                       */
/* ------------------------------------------------------------------ */

interface ProbeResult {
  reachable: boolean;
  /** Playable straight from the browser (CORS friendly / frameable). */
  directOk: boolean;
  /** Reachable once we impersonate the upstream site. */
  proxyOk: boolean;
}

const PROBE_TIMEOUT = 5_000;
/** Never let health-checking delay a page by more than a handful of requests. */
const MAX_PROBED = 10;

async function probeMedia(url: string): Promise<ProbeResult> {
  // 1) Exactly what the browser would do: our origin, no spoofing.
  let directOk = false;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT),
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "*/*",
        Origin: SITE_URL,
        Range: "bytes=0-1",
      },
    });
    const acao = res.headers.get("access-control-allow-origin") || "";
    const corsOk = acao === "*" || acao === SITE_URL;
    directOk = (res.ok || res.status === 206) && corsOk;
    if (res.ok || res.status === 206) {
      // Drain so the socket is released.
      await res.arrayBuffer().catch(() => undefined);
    }
    if (directOk) return { reachable: true, directOk: true, proxyOk: true };
  } catch {
    /* fall through to the spoofed attempt */
  }

  // 2) Same request, wearing the upstream site's identity (with fallbacks).
  try {
    const { response } = await fetchMedia(url, {
      range: "bytes=0-1",
      signal: AbortSignal.timeout(PROBE_TIMEOUT),
    });
    const proxyOk = response.ok || response.status === 206;
    response.body?.cancel().catch(() => undefined);
    return { reachable: proxyOk, directOk: false, proxyOk };
  } catch {
    return { reachable: false, directOk, proxyOk: false };
  }
}

async function probeEmbed(url: string): Promise<ProbeResult> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(PROBE_TIMEOUT),
      headers: upstreamHeaders({ accept: "text/html,*/*;q=0.8" }),
    });
    // We only need the headers.
    res.body?.cancel().catch(() => undefined);
    if (!res.ok) return { reachable: false, directOk: false, proxyOk: false };

    const xfo = (res.headers.get("x-frame-options") || "").toLowerCase();
    const csp = (res.headers.get("content-security-policy") || "").toLowerCase();
    const framingBlocked =
      xfo.includes("deny") ||
      xfo.includes("sameorigin") ||
      /frame-ancestors\s+(?!\*)/.test(csp);

    return { reachable: true, directOk: !framingBlocked, proxyOk: true };
  } catch {
    return { reachable: false, directOk: false, proxyOk: false };
  }
}

/**
 * Health-check every source of an episode (cached — one round of checks per
 * episode every few minutes, shared by all visitors).
 */
export const resolveServers = async (
  episodeId: string,
  servers: PlayableServer[]
): Promise<PlayableServer[]> => {
  if (!PROBE_SOURCES || servers.length === 0) return servers;

  const cached = unstable_cache(
    async () => {
      const results = await Promise.all(
        servers.slice(0, MAX_PROBED).map(async (s) => {
          const probe =
            s.kind === "embed"
              ? await probeEmbed(s.direct)
              : await probeMedia(s.direct);
          return { id: s.id, probe };
        })
      );
      return results;
    },
    ["servers", episodeId, servers.map((s) => s.direct).join("|")],
    { revalidate: 300 }
  );

  let probes: { id: string; probe: ProbeResult }[];
  try {
    probes = await cached();
  } catch {
    return servers;
  }

  // If literally nothing was reachable the checker itself is probably blocked
  // (offline build, firewalled host) — don't punish the user for that.
  if (!probes.some((p) => p.probe.reachable)) return servers;

  const resolved = servers.map((s) => {
    const probe = probes.find((p) => p.id === s.id)?.probe;
    if (!probe) return s;

    if (!probe.reachable) {
      return { ...s, status: "dead" as ServerHealth, note: "لا يستجيب حالياً" };
    }
    if (probe.directOk) {
      return {
        ...s,
        status: "ok" as ServerHealth,
        src: s.direct,
        alt: s.kind === "embed" ? proxiedEmbedUrl(s.direct) : proxiedMediaUrl(s.direct),
        proxied: false,
      };
    }
    // Reachable, but only through us.
    const relay = s.kind === "embed" ? proxiedEmbedUrl(s.direct) : proxiedMediaUrl(s.direct);
    return {
      ...s,
      status: "ok" as ServerHealth,
      src: relay,
      alt: s.direct,
      proxied: true,
      note: "يعمل عبر وسيط سانيمي",
    };
  });

  return resolved.sort(rank);
};
