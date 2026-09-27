import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, ListVideo, Star } from "lucide-react";
import { getAnime, getEpisode, getEpisodeMeta } from "@/lib/animetom";
import { normalizeServers, resolveServers } from "@/lib/servers";
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

  // Clean the messy upstream server list, then health-check every source so the
  // player only offers links that can actually play from our domain.
  const servers = await resolveServers(episode._id, normalizeServers(episode));

  let episodes: Awaited<ReturnType<typeof getEpisodeMeta>> = [];
  try {
    episodes = await getEpisodeMeta(slug);
  } catch {
    episodes = [];
  }

  const title = displayTitle(anime);
  const cover = optimizeImage(anime.r2CoverImage || anime.coverImage, 400);
  const ongoing = (anime.status || "").toLowerCase() === "ongoing";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* main column */}
        <div className="min-w-0">
          <Player
            slug={slug}
            epNumber={num}
            episode={{
              title: episode.title,
              isFiller: episode.isFiller,
              views: episode.views,
              downloadLinks: episode.downloadLinks,
            }}
            anime={{
              slug,
              title: anime.title,
              titleArabic: anime.titleArabic,
              coverImage: anime.r2CoverImage || anime.coverImage,
              poster: optimizeImage(
                anime.r2BannerImage ||
                  anime.bannerImage ||
                  anime.r2CoverImage ||
                  anime.coverImage,
                1280
              ),
            }}
            episodes={episodes}
            servers={servers}
          />

          {/* anime info strip */}
          <div className="glass-panel mt-6 flex gap-4 p-4">
            <Link
              href={`/anime/${slug}`}
              className="relative h-28 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10"
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
                className="line-clamp-1 text-base font-bold text-white transition hover:text-white/70"
              >
                {title}
              </Link>
              <p className="mt-1 text-sm font-medium text-white/55">
                {episode.title || `الحلقة ${toArabicDigits(num)}`}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
                {anime.year && (
                  <span className="chip">
                    <CalendarDays className="h-3 w-3" />
                    {toArabicDigits(anime.year)}
                  </span>
                )}
                {anime.rating > 0 && (
                  <span className="chip">
                    <Star className="h-3 w-3 fill-white" strokeWidth={0} />
                    {toArabicDigits(anime.rating)}
                  </span>
                )}
                <span className={`chip ${ongoing ? "chip-active" : ""}`}>
                  {statusLabel(anime.status)}
                </span>
                {anime.genres.slice(0, 3).map((g) => (
                  <Link
                    key={g}
                    href={`/anime?genres=${encodeURIComponent(g)}`}
                    className="chip hover:bg-white/15"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href={`/anime/${slug}`}
              className="btn btn-sm hidden shrink-0 self-center sm:inline-flex"
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
