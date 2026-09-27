import { BROWSER_UA, UPSTREAM_REFERER, UPSTREAM_SITE } from "./config";

/**
 * Fetching media from hosts that actively dislike being hot-linked.
 *
 * The AnimeTom R2 bucket answers `401 – this bucket cannot be viewed` unless
 * the request looks like it came from animetom.live, and different Cloudflare
 * setups disagree about *which* signal they check (Referer, Origin, both, or
 * the custom domain instead of the pub-*.r2.dev one). Rather than guessing
 * once and failing forever, we walk a short ladder of identities and remember
 * the first that worked for that host.
 */

type Identity = "referer+origin" | "referer" | "plain";

const IDENTITIES: Identity[] = ["referer+origin", "referer", "plain"];

/** host -> identity that last succeeded (small, bounded, per-instance). */
const learned = new Map<string, Identity>();

/**
 * Hosts that serve the same objects. `pub-xxx.r2.dev` and a bucket's custom
 * domain are interchangeable, and sometimes only one of them is public.
 */
const HOST_ALIASES: Record<string, string[]> = parseAliases(
  process.env.MEDIA_HOST_ALIASES
);

function parseAliases(raw?: string): Record<string, string[]> {
  const base: Record<string, string[]> = {
    "pub-497efadc5af745bfa313edcd382f0cd5.r2.dev": ["cdn.animetom.live"],
    "cdn.animetom.live": ["pub-497efadc5af745bfa313edcd382f0cd5.r2.dev"],
  };
  if (!raw) return base;
  for (const pair of raw.split(",")) {
    const [from, to] = pair.split("=").map((v) => v.trim());
    if (!from || !to) continue;
    base[from] = [...(base[from] ?? []), to];
    base[to] = [...(base[to] ?? []), from];
  }
  return base;
}

function headersFor(
  identity: Identity,
  extra: { range?: string | null; accept?: string } = {}
): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": BROWSER_UA,
    Accept: extra.accept ?? "*/*",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
    "Accept-Encoding": "identity",
  };
  if (identity !== "plain") headers.Referer = UPSTREAM_REFERER;
  if (identity === "referer+origin") headers.Origin = UPSTREAM_SITE;
  if (extra.range) headers.Range = extra.range;
  return headers;
}

export interface MediaFetchResult {
  response: Response;
  /** Final URL actually used (may differ when an alias host answered). */
  url: string;
}

/**
 * GET/HEAD a media URL, retrying with different identities (and mirror hosts)
 * whenever the origin replies with an access error.
 */
export async function fetchMedia(
  target: string,
  init: {
    method?: "GET" | "HEAD";
    range?: string | null;
    accept?: string;
    signal?: AbortSignal;
  } = {}
): Promise<MediaFetchResult> {
  const method = init.method ?? "GET";
  const candidates = [target, ...aliasesOf(target)];

  let host = "";
  try {
    host = new URL(target).hostname;
  } catch {
    /* validated by the caller */
  }

  const remembered = learned.get(host);
  const ladder = remembered
    ? [remembered, ...IDENTITIES.filter((i) => i !== remembered)]
    : IDENTITIES;

  let last: Response | null = null;

  for (const url of candidates) {
    for (const identity of ladder) {
      let res: Response;
      try {
        res = await fetch(url, {
          method,
          redirect: "follow",
          cache: "no-store",
          signal: init.signal,
          headers: headersFor(identity, {
            range: init.range,
            accept: init.accept,
          }),
        });
      } catch {
        continue;
      }

      if (res.ok || res.status === 206 || res.status === 304) {
        if (host) learned.set(host, identity);
        return { response: res, url };
      }

      // Only an access problem is worth another identity; 404 means the object
      // really isn't there.
      if (res.status !== 401 && res.status !== 403) {
        return { response: res, url };
      }
      res.body?.cancel().catch(() => undefined);
      last = res;
    }
  }

  return {
    response: last ?? new Response(null, { status: 502 }),
    url: target,
  };
}

function aliasesOf(target: string): string[] {
  try {
    const url = new URL(target);
    const alt = HOST_ALIASES[url.hostname.toLowerCase()];
    if (!alt) return [];
    return alt.map((host) => {
      const copy = new URL(url.toString());
      copy.hostname = host;
      return copy.toString();
    });
  } catch {
    return [];
  }
}
