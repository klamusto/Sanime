import type { NextRequest } from "next/server";
import { upstreamHeaders } from "@/lib/config";
import { decodeTarget, isPublicHttpUrl, verifyTarget } from "@/lib/stream-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Re-frames a third-party player page.
 *
 * Some mirrors ship `X-Frame-Options: SAMEORIGIN` (or a `frame-ancestors` CSP)
 * and only whitelist the original site — the browser then refuses to render the
 * iframe and the user just sees a blank/blocked box. Fetching the page here and
 * serving it from our own origin drops those headers, sends the referer the
 * host expects, and upgrades http-only embeds to https (no mixed-content block).
 *
 * Used as an opt-in fallback: the player offers it when a direct embed fails.
 */

const TIMEOUT = 20_000;

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const encoded = params.get("u");
  const signature = params.get("s") ?? "";
  if (!encoded) return text("missing target", 400);

  let target: string;
  try {
    target = decodeTarget(encoded);
  } catch {
    return text("bad target", 400);
  }
  if (!verifyTarget(target, signature)) return text("bad signature", 403);
  if (!isPublicHttpUrl(target)) return text("target not allowed", 403);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: upstreamHeaders({
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      }),
    });
  } catch {
    return text("upstream unreachable", 502);
  }

  const contentType = upstream.headers.get("content-type") || "";
  if (!contentType.includes("html")) {
    // Not a page (direct file) — hand it back untouched.
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  }

  let html = await upstream.text();
  const base = upstream.url || target;

  // Give relative assets an absolute root and stop the page from busting out.
  const baseTag = `<base href="${escapeAttr(base)}">`;
  const frameGuard = `<script>try{Object.defineProperty(window,'top',{get:function(){return window.self}});}catch(e){}</script>`;

  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}${frameGuard}`);
  } else {
    html = `${baseTag}${frameGuard}${html}`;
  }
  // Neutralise meta-based framing/CSP restrictions.
  html = html.replace(
    /<meta[^>]+http-equiv=["']?(content-security-policy|x-frame-options)["']?[^>]*>/gi,
    ""
  );

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function text(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
