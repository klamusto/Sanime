import { createHmac, timingSafeEqual } from "crypto";
import { ALLOW_PRIVATE_TARGETS, STREAM_SECRET } from "./config";

/**
 * Signed URLs for the media proxy.
 *
 * /api/stream only fetches targets that carry a valid signature, so the route
 * can never be used as a generic open proxy by third parties.
 */

export function encodeTarget(url: string): string {
  return Buffer.from(url, "utf8").toString("base64url");
}

export function decodeTarget(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString("utf8");
}

export function signTarget(url: string): string {
  return createHmac("sha256", STREAM_SECRET)
    .update(url)
    .digest("base64url")
    .slice(0, 32);
}

export function verifyTarget(url: string, signature: string): boolean {
  const expected = Buffer.from(signTarget(url));
  const given = Buffer.from(signature || "");
  if (expected.length !== given.length) return false;
  try {
    return timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

/** Build the same-origin URL the player should request. */
export function proxiedMediaUrl(target: string): string {
  const u = encodeTarget(target);
  const s = signTarget(target);
  return `/api/stream?u=${u}&s=${s}`;
}

/** Build the same-origin URL that re-frames a third-party embed page. */
export function proxiedEmbedUrl(target: string): string {
  const u = encodeTarget(target);
  const s = signTarget(target);
  return `/api/embed?u=${u}&s=${s}`;
}

/** Block SSRF attempts against the local network. */
export function isPublicHttpUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  // Dev-only: lets a local mock upstream be used while testing.
  if (ALLOW_PRIVATE_TARGETS) return true;

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return false;
  }
  // IPv4 private / loopback / link-local ranges
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
  }
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd")) {
    return false;
  }
  return true;
}
