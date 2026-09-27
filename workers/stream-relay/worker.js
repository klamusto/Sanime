/**
 * Sanime stream relay — optional Cloudflare Worker.
 *
 * Why: the site's built-in /api/stream works everywhere, but on Vercel every
 * proxied video byte counts against your plan's bandwidth. Cloudflare Workers
 * are free for this kind of traffic, so you can point the site at this Worker
 * and keep your hosting bill flat.
 *
 * It speaks exactly the same protocol as /api/stream:
 *   GET /api/stream?u=<base64url(target)>&s=<hmac-sha256 base64url, 32 chars>
 *
 * Deploy:
 *   cd workers/stream-relay
 *   npx wrangler secret put STREAM_SECRET   # same value as the site
 *   npx wrangler deploy
 * Then set NEXT_PUBLIC_STREAM_RELAY=https://<worker>.workers.dev on Vercel.
 */

const UPSTREAM_SITE = "https://animetom.live";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

const IDENTITIES = ["referer+origin", "referer", "plain"];

const HOST_ALIASES = {
  "pub-497efadc5af745bfa313edcd382f0cd5.r2.dev": "cdn.animetom.live",
  "cdn.animetom.live": "pub-497efadc5af745bfa313edcd382f0cd5.r2.dev",
};

const relay = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors() });
    }
    if (!url.pathname.startsWith("/api/stream")) {
      return new Response("Sanime relay", { status: 200, headers: cors() });
    }

    const encoded = url.searchParams.get("u");
    const signature = url.searchParams.get("s") || "";
    if (!encoded) return json({ success: false, message: "missing target" }, 400);

    let target;
    try {
      target = decodeTarget(encoded);
    } catch {
      return json({ success: false, message: "bad target" }, 400);
    }

    const secret = env.STREAM_SECRET || "";
    if (!(await verify(target, signature, secret))) {
      return json({ success: false, message: "bad signature" }, 403);
    }
    if (!/^https?:\/\//i.test(target)) {
      return json({ success: false, message: "target not allowed" }, 403);
    }

    const range = request.headers.get("range");
    const upstream = await fetchWithIdentities(target, request.method, range);
    if (!upstream) return json({ success: false, message: "upstream unreachable" }, 502);

    if (!upstream.ok && upstream.status !== 206) {
      return json(
        { success: false, message: `upstream responded ${upstream.status}` },
        upstream.status
      );
    }

    const contentType = (upstream.headers.get("content-type") || "").toLowerCase();
    const isPlaylist =
      /\.m3u8(\?|$)/i.test(target) || contentType.includes("mpegurl");

    if (request.method === "GET" && isPlaylist) {
      const text = await upstream.text();
      const body = await rewritePlaylist(text, upstream.url || target, url.origin, secret);
      const headers = cors();
      headers.set("Content-Type", "application/vnd.apple.mpegurl");
      headers.set("Cache-Control", "public, max-age=2");
      return new Response(body, { status: 200, headers });
    }

    const headers = cors();
    for (const key of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
      "etag",
      "last-modified",
    ]) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }
    if (!headers.has("accept-ranges")) headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=3600");

    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers,
    });
  },
};

export default relay;

/* --------------------------------- helpers -------------------------------- */

function cors() {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type",
    "Access-Control-Expose-Headers":
      "Content-Length, Content-Range, Accept-Ranges, Content-Type",
  });
}

function json(body, status) {
  const headers = cors();
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

function decodeTarget(encoded) {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeTarget(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  let binary = "";
  for (const b of new Uint8Array(mac)) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, 32);
}

async function verify(value, signature, secret) {
  if (!secret || !signature) return false;
  const expected = await sign(value, secret);
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

function headersFor(identity, range) {
  const headers = new Headers({
    "User-Agent": UA,
    Accept: "*/*",
    "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
  });
  if (identity !== "plain") headers.set("Referer", `${UPSTREAM_SITE}/`);
  if (identity === "referer+origin") headers.set("Origin", UPSTREAM_SITE);
  if (range) headers.set("Range", range);
  return headers;
}

async function fetchWithIdentities(target, method, range) {
  const candidates = [target];
  try {
    const url = new URL(target);
    const alias = HOST_ALIASES[url.hostname.toLowerCase()];
    if (alias) {
      const copy = new URL(target);
      copy.hostname = alias;
      candidates.push(copy.toString());
    }
  } catch {
    /* ignore */
  }

  let last = null;
  for (const candidate of candidates) {
    for (const identity of IDENTITIES) {
      let res;
      try {
        res = await fetch(candidate, {
          method,
          redirect: "follow",
          headers: headersFor(identity, range),
        });
      } catch {
        continue;
      }
      if (res.ok || res.status === 206 || res.status === 304) return res;
      if (res.status !== 401 && res.status !== 403) return res;
      last = res;
    }
  }
  return last;
}

async function rewritePlaylist(body, baseUrl, relayOrigin, secret) {
  const base = new URL(baseUrl);

  const wrap = async (uri) => {
    const trimmed = uri.trim();
    if (!trimmed || /^data:/i.test(trimmed)) return trimmed;
    let absolute;
    try {
      absolute = new URL(trimmed, base).toString();
    } catch {
      return trimmed;
    }
    const signature = await sign(absolute, secret);
    return `${relayOrigin}/api/stream?u=${encodeTarget(absolute)}&s=${signature}`;
  };

  const lines = body.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push(line);
      continue;
    }
    if (trimmed.startsWith("#")) {
      if (/URI="/.test(trimmed)) {
        const matches = [...trimmed.matchAll(/URI="([^"]+)"/g)];
        let rewritten = trimmed;
        for (const match of matches) {
          rewritten = rewritten.replace(
            `URI="${match[1]}"`,
            `URI="${await wrap(match[1])}"`
          );
        }
        out.push(rewritten);
      } else {
        out.push(line);
      }
      continue;
    }
    out.push(await wrap(trimmed));
  }
  return out.join("\n");
}
