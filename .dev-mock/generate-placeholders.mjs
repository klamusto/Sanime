/**
 * Regenerates the greyscale placeholder art used by the offline mock upstream.
 *
 *   node .dev-mock/generate-placeholders.mjs
 *
 * Output goes to public/_dev/ (excluded from deployments via .vercelignore).
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/* ---- tiny PNG writer so placeholders work through next/image (no SVG) ---- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** Vertical grey gradient with a soft highlight — matches the site's palette. */
function placeholderPng(seed, w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let offset = 0;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) / 3.2;
  for (let y = 0; y < h; y++) {
    raw[offset++] = 0; // filter: none
    const base = Math.round(30 - (24 * y) / h);
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const glow = d < radius ? Math.round(18 * (1 - d / radius)) : 0;
      const v = Math.min(255, base + glow + ((seed * 7) % 6));
      raw[offset++] = v;
      raw[offset++] = v;
      raw[offset++] = v;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}


const outDir = path.join(process.cwd(), "public", "_dev");
fs.mkdirSync(outDir, { recursive: true });

for (let i = 1; i <= 12; i++) {
  fs.writeFileSync(path.join(outDir, `cover-${i}.png`), placeholderPng(i, 400, 600));
}
fs.writeFileSync(path.join(outDir, "banner.png"), placeholderPng(3, 1200, 675));

console.log(`[placeholders] wrote 13 files to ${outDir}`);
