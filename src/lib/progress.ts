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

/* ------------------------------------------------------------------ *
 * Tiny observable store on top of localStorage so React can read it
 * with useSyncExternalStore (no setState-inside-effect dance).
 * ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedList: WatchProgress[] = [];
const EMPTY: WatchProgress[] = [];

function read(): Record<string, WatchProgress> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, WatchProgress>) : {};
  } catch {
    return {};
  }
}

function write(all: Record<string, WatchProgress>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable (private mode / quota) */
  }
  for (const listener of listeners) listener();
}

export function getProgress(): Record<string, WatchProgress> {
  return read();
}

export function getProgressFor(slug: string): WatchProgress | undefined {
  return read()[slug];
}

export function saveProgress(p: Omit<WatchProgress, "updatedAt">): void {
  const all = read();
  all[p.slug] = { ...p, updatedAt: Date.now() };
  // keep at most 30 entries, drop the oldest
  const entries = Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
  const trimmed: Record<string, WatchProgress> = {};
  for (const e of entries.slice(0, 30)) trimmed[e.slug] = e;
  write(trimmed);
}

export function removeProgress(slug: string): void {
  const all = read();
  delete all[slug];
  write(all);
}

export function subscribeProgress(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Stable snapshot (same array reference until the data really changes). */
export function progressSnapshot(): WatchProgress[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  cachedList = Object.values(read()).sort((a, b) => b.updatedAt - a.updatedAt);
  return cachedList;
}

export function progressServerSnapshot(): WatchProgress[] {
  return EMPTY;
}
