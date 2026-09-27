import type { NextRequest } from "next/server";
import { fetchMedia } from "@/lib/fetch-media";
import {
  decodeTarget,
  isPublicHttpUrl,
  proxiedMediaUrl,
  verifyTarget,
} from "@/lib/stream-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Serverless platforms cut idle functions off early; video segments need room.
export const maxDuration = 60;

/**
 * Media relay.
 *
 * Why this exists
 * ---------------
 * AnimeTom's own episodes live on a Cloudflare R2 bucket
 * (`pub-…​.r2.dev` / `cdn.animetom.live`) that answers `401 – this bucket cannot
 * be viewed` to anyone who isn't animetom.live, and it never sends CORS
 * headers. A browser on *our* domain therefore cannot touch the playlist at
 * all — which is exactly the "new episodes work there but not on my site"
 * problem. Older mirrors have the same issue in a softer form (no
 * `Access-Control-Allow-Origin`, hot-link protection, http-only URLs).
 *
 * So the browser never talks to the CDN: it talks to us, and we replay the
 * request server-to-server with the identity the CDN expects, rewrite every
 * playlist entry back through this route, and stream the bytes down with
 * permissive CORS + byte-range support.
 */

const PLAYLIST_CT = "application/vnd.apple.mpegurl";
const CONNECT_TIMEOUT = 20_000;

function cors(headers: Headers) {
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Range, Content-Type");
  headers.set(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Range, Accept-Ranges, Content-Type"
  );
  return headers;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors(new Headers()) });
}

function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: cors(
      new Headers({ "Content-Type": "application/json; charset=utf-8" })
    ),
  });
}

/** Rewrite every URI inside an m3u8 so it keeps flowing through this route. */
function rewritePlaylist(body: string, baseUrl: string): string {
  const base = new URL(baseUrl);

  const absolutize = (uri: string): string => {
    const trimmed = uri.trim();
    if (!trimmed) return trimmed;
    if (/^data:/i.test(trimmed)) return trimmed;
    try {
      return new URL(trimmed, base).toString();
    } catch {
      return trimmed;
    }
  };

  const wrap = (uri: string) => proxiedMediaUrl(absolutize(uri));

  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      if (trimmed.startsWith("#")) {
        // Tags that carry a URI="…" attribute (keys, init segments, audio /
        // subtitle renditions, i-frame variants).
        if (/URI="/.test(trimmed)) {
          return trimmed.replace(
            /URI="([^"]+)"/g,
            (_m, uri: string) => `URI="${wrap(uri)}"`
          );
        }
        return line;
      }

      // Bare line => variant playlist or media segment.
      return wrap(trimmed);
    })
    .join("\n");
}

function looksLikePlaylist(url: string, contentType: string, head: string) {
  return (
    head.startsWith("#EXTM3U") ||
    contentType.includes("mpegurl") ||
    contentType.includes("x-mpegURL".toLowerCase()) ||
    /\.m3u8(\?|$)/i.test(url)
  );
}

export async function GET(req: NextRequest) {
  return handle(req, "GET");
}

export async function HEAD(req: NextRequest) {
  return handle(req, "HEAD");
}

async function handle(req: NextRequest, method: "GET" | "HEAD") {
  const params = req.nextUrl.searchParams;
  const encoded = params.get("u");
  const signature = params.get("s") ?? "";
  if (!encoded) return badRequest("missing target");

  let target: string;
  try {
    target = decodeTarget(encoded);
  } catch {
    return badRequest("bad target encoding");
  }

  if (!verifyTarget(target, signature)) return badRequest("bad signature", 403);
  if (!isPublicHttpUrl(target)) return badRequest("target not allowed", 403);

  const range = req.headers.get("range");
  const controller = new AbortController();
  const connectTimer = setTimeout(() => controller.abort(), CONNECT_TIMEOUT);

  let upstream: Response;
  let resolvedUrl: string;
  try {
    const result = await fetchMedia(target, {
      method,
      range,
      signal: controller.signal,
    });
    upstream = result.response;
    resolvedUrl = result.url;
  } catch {
    clearTimeout(connectTimer);
    return badRequest("upstream unreachable", 502);
  }
  // Headers are in — the body may stream for minutes, so stop the timer.
  clearTimeout(connectTimer);

  if (!upstream.ok && upstream.status !== 206) {
    return badRequest(`upstream responded ${upstream.status}`, upstream.status);
  }

  const contentType = (
    upstream.headers.get("content-type") || ""
  ).toLowerCase();

  // Playlists are small: buffer, rewrite, return.
  const isM3u8Path = /\.m3u8(\?|$)/i.test(target) || contentType.includes("mpegurl");
  if (method === "GET" && isM3u8Path) {
    const text = await upstream.text();
    if (looksLikePlaylist(target, contentType, text.trimStart())) {
      const rewritten = rewritePlaylist(text, upstream.url || resolvedUrl);
      return new Response(rewritten, {
        status: 200,
        headers: cors(
          new Headers({
            "Content-Type": PLAYLIST_CT,
            "Cache-Control": "public, max-age=2, s-maxage=5",
          })
        ),
      });
    }
    return new Response(text, {
      status: upstream.status,
      headers: cors(
        new Headers({ "Content-Type": contentType || "text/plain" })
      ),
    });
  }

  // Everything else (segments, keys, mp4) is streamed straight through.
  const headers = cors(new Headers());
  const passthrough = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified",
  ];
  for (const key of passthrough) {
    const value = upstream.headers.get(key);
    if (value) headers.set(key, value);
  }
  if (!headers.has("accept-ranges")) headers.set("Accept-Ranges", "bytes");
  if (!headers.has("content-type")) {
    headers.set("Content-Type", guessType(target));
  }
  headers.set("Cache-Control", "public, max-age=3600");

  return new Response(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

function guessType(url: string): string {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".ts")) return "video/mp2t";
  if (path.endsWith(".m4s") || path.endsWith(".mp4")) return "video/mp4";
  if (path.endsWith(".webm")) return "video/webm";
  if (path.endsWith(".vtt")) return "text/vtt";
  if (path.endsWith(".key")) return "application/octet-stream";
  if (path.endsWith(".aac")) return "audio/aac";
  if (path.endsWith(".mp3")) return "audio/mpeg";
  return "application/octet-stream";
}
