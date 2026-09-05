// Types matching the upstream content API used by Sanime.

export interface AgeRating {
  code?: string;
  minAge?: number;
  label?: string;
  source?: string;
  malId?: number | null;
}

export interface Anime {
  _id: string;
  slug: string;
  title: string;
  titleEnglish?: string;
  titleArabic?: string;
  description?: string;
  coverImage: string;
  r2CoverImage?: string;
  bannerImage?: string;
  r2BannerImage?: string;
  episodes: number;
  status: string;
  genres: string[];
  year: number | null;
  rating: number;
  episodeDuration?: string;
  trailerUrl?: string;
  author?: string;
  studio?: string;
  isPublished?: boolean;
  type?: string;
  sourceMaterial?: string;
  season?: string;
  month?: number | null;
  day?: number | null;
  startDate?: string;
  sourceUrl?: string;
  malUrl?: string;
  anilistId?: number | null;
  studios?: string[];
  ageRating?: AgeRating;
  isPinned?: boolean;
  isSeasonal?: boolean;
  seasonalPriority?: number;
  publishedEpisodes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnimeRef {
  _id: string;
  title: string;
  coverImage: string;
  bannerImage?: string;
  status?: string;
  rating?: number;
  slug: string;
}

export interface LatestEpisode {
  _id: string;
  number: number;
  title: string;
  views?: number;
  createdAt: string;
  animeId: AnimeRef;
}

export interface EpisodeServer {
  name: string;
  embedUrl?: string;
  url?: string;
  priority?: number;
  isAnimeTom?: boolean;
  type?: string;
  qualities?: string[];
  _id?: string;
}

export interface Episode {
  _id: string;
  animeId: string;
  number: number;
  title: string;
  servers: EpisodeServer[];
  isPublished: boolean;
  views?: number;
  qualities?: string[];
  r2Path?: string;
  isPinned?: boolean;
  isFiller?: boolean;
  downloadCount?: number;
  downloadLinks?: { name: string; url: string; quality?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

/** Lightweight episode entry used for episode grids (servers stripped). */
export interface EpisodeMeta {
  _id: string;
  number: number;
  title: string;
  isPublished?: boolean;
  isFiller?: boolean;
  views?: number;
  createdAt?: string;
}

export interface FeaturedItem {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  bannerImage?: string;
  year: number | null;
  genres: string[];
  status: string;
  rating?: number;
  episodeNumber: number;
  episodeId: string;
  animeSlug: string;
  isPinned?: boolean;
}

export interface SeasonalItem {
  _id: string;
  title: string;
  coverImage: string;
  episodes: number;
  publishedEpisodes?: number;
  status: string;
  year: number | null;
  rating: number;
  type?: string;
  seasonalPriority?: number;
  slug: string;
}

export interface Character {
  id: number;
  name: string;
  nameNative?: string;
  image?: string;
  description?: string;
}

export interface ExternalData {
  anilistId?: number | null;
  characters?: Character[];
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalResults?: number;
  totalCount?: number;
  resultsPerPage?: number;
  limit?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiList<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
