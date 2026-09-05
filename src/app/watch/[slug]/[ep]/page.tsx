import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, ListVideo, Play, Star } from "lucide-react";
import { getAnime, getEpisode, getEpisodeMeta } from "@/lib/animetom";
import {
  displayTitle,
  optimizeImage,
  statusLabel,
  toArabicDigits,
} from "@/lib/format";
import Player from "./player";
import EpisodeSidebar from "./episode-sidebar";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string; ep: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, ep } = await params;
  const num = Number.parseInt(ep, 10);
  try {
    const { anime } = await getAnime(slug);
    const title = displayTitle(anime);
    const epTitle = Number.isNaN(num) ? "" : `الحلقة ${toArabicDigits(num)} من `;
    return {
      title: `${epTitle}${title}`,
      description: `شاهد ${epTitle}${title} مترجم للعربية بجودة عالية على Sanime.`,
      openGraph: {
        title: `${epTitle}${title}`,
        images: anime.coverImage ? [{ url: anime.coverImage }] : undefined,
      },
    };
  } catch {
    return { title: "المشاهدة" };
  }
}

export default async function WatchPage({ params }: Props) {
  const { slug, ep } = await params;
  const num = Number.parseInt(ep, 10);

  if (Number.isNaN(num) || num < 0) notFound();

  let episode: Awaited<ReturnType<typeof getEpisode>>["episode"];
  let anime: Awaited<ReturnType<typeof getAnime>>["anime"];
  try {
    const [epRes, animeRes] = await Promise.all([
      getEpisode(slug, num),
      getAnime(slug),
    ]);
    episode = epRes.episode;
    anime = animeRes.anime;
  } catch {
    notFound();
  }

  let episodes: Awaited<ReturnType<typeof getEpisodeMeta>> = [];
  try {
    episodes = await getEpisodeMeta(slug);
  } catch {
    episodes = [];
  }

  const title = displayTitle(anime);
  const cover = optimizeImage(anime.r2CoverImage || anime.coverImage, 400);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* main column */}
        <div className="min-w-0">
          <Player
            slug={slug}
            epNumber={num}
            episode={episode}
            anime={{
              slug,
              title: anime.title,
              titleArabic: anime.titleArabic,
              coverImage: anime.r2CoverImage || anime.coverImage,
            }}
            episodes={episodes}
          />

          {/* anime info strip */}
          <div className="mt-5 flex gap-4 rounded-2xl border border-edge bg-surface/70 p-4">
            <Link
              href={`/anime/${slug}`}
              className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-edge"
            >
              <Image
                src={cover}
                alt={title}
                fill
                sizes="80px"
                className="object-cover"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/anime/${slug}`}
                className="line-clamp-1 text-base font-bold text-white transition hover:text-primary-soft"
              >
                {title}
              </Link>
              <p className="mt-1 text-sm font-medium text-primary-soft">
                {episode.title || `الحلقة ${toArabicDigits(num)}`}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                {anime.year && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {toArabicDigits(anime.year)}
                  </span>
                )}
                {anime.rating > 0 && (
                  <span className="flex items-center gap-1 text-amber-300">
                    <Star className="h-3.5 w-3.5 fill-amber-300" />
                    {toArabicDigits(anime.rating)}
                  </span>
                )}
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    (anime.status || "").toLowerCase() === "ongoing"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-primary/15 text-primary-soft"
                  }`}
                >
                  {statusLabel(anime.status)}
                </span>
                {anime.genres.slice(0, 3).map((g) => (
                  <Link
                    key={g}
                    href={`/anime?genres=${encodeURIComponent(g)}`}
                    className="rounded-full border border-edge px-2 py-0.5 transition hover:border-primary/50 hover:text-primary-soft"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href={`/anime/${slug}`}
              className="hidden shrink-0 items-center gap-2 self-center rounded-xl border border-edge px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-primary/50 hover:text-white sm:flex"
            >
              <ListVideo className="h-4 w-4" />
              صفحة الأنمي
            </Link>
          </div>
        </div>

        {/* sidebar */}
        <aside className="min-w-0">
          <EpisodeSidebar slug={slug} episodes={episodes} current={num} />
        </aside>
      </div>
    </div>
  );
}


