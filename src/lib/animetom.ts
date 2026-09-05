import { unstable_cache } from "next/cache";
import type {
  Anime,
  ApiList,
  Episode,
  EpisodeMeta,
  ExternalData,
  FeaturedItem,
  LatestEpisode,
  SeasonalItem,
} from "./types";

/**
 * Sanime content layer — server-side gateway to the upstream catalog.
 * Every call is cached (ISR-style) so the site behaves like it owns the data.
 */

const BASE_URL = "https://api.animetom.live/api";
const TIMEOUT = 15_000;

const REVALIDATE = {
  list: 300, // 5 minutes
  detail: 600, // 10 minutes
  episode: 60, // 1 minute (fresh servers)
  episodes: 300, // 5 minutes
};

type Json = Record<string, unknown>;

async function fetchJson(path: string, _revalidate: number): Promise<Json> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT),
    headers: {
      Accept: "application/json",
      "User-Agent": "Sanime/1.0 (web viewer)",
    },
  });

  if (!res.ok) {
    throw new Error(`Upstream ${res.status} for ${path}`);
  }
  const json = (await res.json()) as Json;
  if (json.success === false) {
    throw new Error((json.message as string) || "Upstream error");
  }
  return json;
}

/**
 * Cached fetch wrapper keyed by (path + revalidate). All Sanime reads go
 * through this so identical requests hit the Next.js data cache instead of
 * hammering the upstream API.
 */
const cachedJson = (path: string, revalidate: number) =>
  unstable_cache(
    () => fetchJson(path, revalidate),
    [path, String(revalidate)],
    { revalidate }
  )();

/* ------------------------------------------------------------------ */
/* Lists                                                               */
/* ------------------------------------------------------------------ */

export interface AnimeQuery {
  page?: number;
  limit?: number;
  genres?: string[];
  type?: string;
  status?: string;
  year?: string;
  sort?: string;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function getAnimeList(query: AnimeQuery): Promise<ApiList<Anime>> {
  const params: Record<string, string | number | undefined> = {
    page: query.page ?? 1,
    limit: query.limit ?? 24,
    type: query.type,
    status: query.status,
    year: query.year,
    sort: query.sort,
  };
  if (query.genres && query.genres.length > 0) {
    params.genres = query.genres.join(",");
  }
  const path = `/anime${buildQuery(params)}`;
  return cachedJson(path, REVALIDATE.list).then((j) => ({
    data: (j.data as Anime[]) || [],
    pagination: (j.pagination as ApiList<Anime>["pagination"]) || emptyPagination(),
  }));
}

export function searchAnime(
  q: string,
  page = 1,
  limit = 24
): Promise<ApiList<Anime>> {
  const path = `/anime/search${buildQuery({ q, page, limit })}`;
  return cachedJson(path, REVALIDATE.list).then((j) => ({
    data: (j.data as Anime[]) || [],
    pagination: (j.pagination as ApiList<Anime>["pagination"]) || emptyPagination(),
  }));
}

export function getLatestEpisodes(
  page = 1,
  limit = 24
): Promise<ApiList<LatestEpisode>> {
  const path = `/anime/latest-episodes${buildQuery({ page, limit })}`;
  return cachedJson(path, REVALIDATE.list).then((j) => ({
    data: (j.data as LatestEpisode[]) || [],
    pagination: (j.pagination as ApiList<LatestEpisode>["pagination"]) ||
      emptyPagination(),
  }));
}

export function getSeasonal(limit = 14): Promise<SeasonalItem[]> {
  const path = `/anime/seasonal${buildQuery({ limit })}`;
  return cachedJson(path, REVALIDATE.list).then(
    (j) => (j.data as SeasonalItem[]) || []
  );
}

export function getFeatured(limit = 10): Promise<FeaturedItem[]> {
  const path = `/anime/featured-episodes${buildQuery({ limit })}`;
  return cachedJson(path, REVALIDATE.list).then(
    (j) => (j.data as FeaturedItem[]) || []
  );
}

/* ------------------------------------------------------------------ */
/* Details                                                             */
/* ------------------------------------------------------------------ */

export async function getAnime(slug: string): Promise<{
  anime: Anime;
  relations: Anime[];
}> {
  const path = `/anime/${encodeURIComponent(slug)}`;
  const json = await cachedJson(path, REVALIDATE.detail);
  const data = json.data as { anime?: Anime; relations?: Anime[] };
  if (!data?.anime) throw new Error("anime-not-found");
  return { anime: data.anime, relations: data.relations || [] };
}

export async function getExternalData(slug: string): Promise<ExternalData> {
  try {
    const path = `/anime/external-data/${encodeURIComponent(slug)}`;
    const json = await cachedJson(path, REVALIDATE.detail);
    return (json.data as ExternalData) || {};
  } catch {
    return {};
  }
}

export async function getEpisodeMeta(slug: string): Promise<EpisodeMeta[]> {
  const path = `/anime/${encodeURIComponent(slug)}/all-episodes`;
  const json = await cachedJson(path, REVALIDATE.episodes);
  const eps = (json.data as Episode[]) || [];
  // Strip heavy server payloads before sending to the client.
  return eps
    .map((e) => ({
      _id: e._id,
      number: e.number,
      title: e.title || `الحلقة ${e.number}`,
      isPublished: e.isPublished,
      isFiller: e.isFiller,
      views: e.views,
      createdAt: e.createdAt,
    }))
    .sort((a, b) => a.number - b.number);
}

export async function getEpisode(
  slug: string,
  number: number
): Promise<{ episode: Episode; anime: Anime }> {
  const [epJson, animeJson] = await Promise.all([
    cachedJson(
      `/anime/${encodeURIComponent(slug)}/episodes/${number}`,
      REVALIDATE.episode
    ),
    cachedJson(`/anime/${encodeURIComponent(slug)}`, REVALIDATE.detail),
  ]);
  const episode = (epJson.data as Episode) || null;
  const animeData = animeJson.data as { anime?: Anime };
  if (!episode || !animeData?.anime) throw new Error("episode-not-found");
  return { episode, anime: animeData.anime };
}

export async function getEpisodeCount(slug: string): Promise<number> {
  try {
    const path = `/anime/${encodeURIComponent(slug)}/episode-count`;
    const json = await cachedJson(path, REVALIDATE.episodes);
    const count = (json.data as { count?: number })?.count;
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

/* ------------------------------------------------------------------ */

export function emptyPagination() {
  return {
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
    hasNextPage: false,
    hasPrevPage: false,
  };
}
