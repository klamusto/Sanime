"use client";

export interface WatchProgress {
  slug: string;
  ep: number;
  time: number;
  duration: number;
  animeTitle: string;
  animeArabic?: string;
  coverImage?: string;
  updatedAt: number;
}

const KEY = "sanime_progress_v1";

export function getProgress(): Record<string, WatchProgress> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, WatchProgress>) : {};
  } catch {
    return {};
  }
}

export function getProgressFor(slug: string): WatchProgress | undefined {
  return getProgress()[slug];
}

export function saveProgress(p: Omit<WatchProgress, "updatedAt">): void {
  try {
    const all = getProgress();
    all[p.slug] = { ...p, updatedAt: Date.now() };
    // keep at most 30 entries, drop oldest
    const entries = Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
    const trimmed: Record<string, WatchProgress> = {};
    for (const e of entries.slice(0, 30)) trimmed[e.slug] = e;
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* storage unavailable */
  }
}

export function removeProgress(slug: string): void {
  try {
    const all = getProgress();
    delete all[slug];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* noop */
  }
}
