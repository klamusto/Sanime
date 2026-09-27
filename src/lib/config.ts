/**
 * Central runtime configuration.
 *
 * Everything that touches the upstream content API lives here so the site can
 * be re-pointed (or the anti-hotlink identity tweaked) with env vars instead of
 * code edits.
 */

function clean(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Upstream JSON API root. */
export const API_BASE = clean(
  process.env.ANIMETOM_API_BASE || "https://api.animetom.live/api"
);

/**
 * Origin the upstream CDN expects to see in `Origin` / `Referer`.
 *
 * The AnimeTom R2 bucket (pub-*.r2.dev / cdn.animetom.live) answers `401 – this
 * bucket cannot be viewed` for foreign referers, which is exactly why brand new
 * AnimeTom-hosted episodes play on their site and die on a clone. Our media
 * proxy replays requests with this identity, so playback works again.
 */
export const UPSTREAM_SITE = clean(
  process.env.UPSTREAM_SITE || "https://animetom.live"
);

export const UPSTREAM_REFERER = `${UPSTREAM_SITE}/`;

export const BROWSER_UA =
  process.env.UPSTREAM_UA ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

/** Secret used to sign proxy URLs so /api/stream can't be abused as an open proxy. */
export const STREAM_SECRET =
  process.env.STREAM_SECRET || "sanime-default-stream-secret-change-me";

/**
 * "on"   – always route video through our proxy (most reliable, uses bandwidth)
 * "auto" – proxy only hosts that are known to block foreign origins (default)
 * "off"  – never proxy (the browser talks to the CDN directly)
 */
export const STREAM_PROXY_MODE = (process.env.STREAM_PROXY || "auto") as
  | "on"
  | "auto"
  | "off";

/** Dev escape hatch: allow proxying localhost/private targets (mock upstream). */
export const ALLOW_PRIVATE_TARGETS = process.env.ALLOW_PRIVATE_TARGETS === "1";

/** Set STREAM_PROBE=0 to skip the server-side "is this source alive?" checks. */
export const PROBE_SOURCES = process.env.STREAM_PROBE !== "0";

export const SITE_URL = clean(
  process.env.NEXT_PUBLIC_SITE_URL || "https://sanime.app"
);

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Sanime";

/** Hosts that refuse cross-origin playback and therefore always need the proxy. */
const ALWAYS_PROXY = [
  "r2.dev",
  "r2.cloudflarestorage.com",
  "animetom.live",
  "witanime",
  "anime4up",
  "b-cdn.net",
  "bunnycdn",
];

export function needsProxy(rawUrl: string): boolean {
  if (STREAM_PROXY_MODE === "off") return false;
  if (STREAM_PROXY_MODE === "on") return true;
  let host = "";
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
  return ALWAYS_PROXY.some((h) => host.includes(h));
}

/** Browser-ish headers, optionally impersonating the upstream site. */
export function upstreamHeaders(
  init: { referer?: boolean; range?: string | null; accept?: string } = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": BROWSER_UA,
    Accept: init.accept ?? "*/*",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "identity",
  };
  if (init.referer !== false) {
    headers.Referer = UPSTREAM_REFERER;
    headers.Origin = UPSTREAM_SITE;
  }
  if (init.range) headers.Range = init.range;
  return headers;
}
