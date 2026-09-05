/** Small shared formatting / normalization helpers (safe on server & client). */

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

export function toArabicDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]);
}

export function formatCount(n: number | undefined | null): string {
  if (n === undefined || n === null) return "٠";
  if (n >= 1_000_000) return `${toArabicDigits((n / 1_000_000).toFixed(1))}م`;
  if (n >= 1_000) return `${toArabicDigits((n / 1_000).toFixed(1))} ألف`;
  return toArabicDigits(n);
}

export function timeAgo(iso: string | undefined | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${toArabicDigits(mins)} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${toArabicDigits(hours)} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${toArabicDigits(days)} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${toArabicDigits(months)} شهر`;
  return `منذ ${toArabicDigits(Math.floor(months / 12))} سنة`;
}

export function displayTitle(a: {
  title?: string;
  titleArabic?: string;
  titleEnglish?: string;
}): string {
  if (a.titleArabic && a.titleArabic.trim()) return a.titleArabic.trim();
  if (a.title && a.title.trim()) return titleCase(a.title);
  return "بدون عنوان";
}

/** Best effort title casing for latin titles. */
export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const STATUS_LABEL: Record<string, string> = {
  ongoing: "يعرض الآن",
  completed: "مكتمل",
  مكتمل: "مكتمل",
  upcoming: "قريباً",
  paused: "متوقف",
};

export function statusLabel(status?: string): string {
  if (!status) return "";
  return STATUS_LABEL[status] ?? status;
}

export const TYPE_LABEL: Record<string, string> = {
  TV: "مسلسل",
  Movie: "فيلم",
  OVA: "أوفا",
  ONA: "أونا",
  Special: "خاص",
  Music: "موسيقى",
};

export function typeLabel(type?: string): string {
  if (!type) return "";
  return TYPE_LABEL[type] ?? type;
}

/** Add CDN resizing for known image hosts so pages load fast. */
export function optimizeImage(url: string | undefined | null, width = 600): string {
  if (!url) return "";
  if (url.includes("res.cloudinary.com")) {
    // Cloudinary transformation: resize + auto format/quality.
    return url.replace(
      "/image/upload/",
      `/image/upload/w_${width},f_auto,q_auto:eco/`
    );
  }
  return url;
}

export function youtubeId(url: string | undefined | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/
  );
  return match ? match[1] : null;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function pageParam(value: unknown, fallback = 1): number {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, 10_000);
}
