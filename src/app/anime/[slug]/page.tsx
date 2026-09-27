import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  Building2,
  CalendarDays,
  Clock,
  ListVideo,
  Play,
  Star,
  Users,
} from "lucide-react";
import { getAnime, getEpisodeMeta, getExternalData } from "@/lib/animetom";
import {
  displayTitle,
  optimizeImage,
  statusLabel,
  toArabicDigits,
  typeLabel,
} from "@/lib/format";
import EpisodeGrid from "@/components/episode-grid";
import TrailerButton from "@/components/trailer-modal";
import AnimeCard from "@/components/anime-card";
import Section from "@/components/section";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { anime } = await getAnime(slug);
    const title = displayTitle(anime);
    return {
      title: `${title}`,
      description:
        anime.description?.slice(0, 160) ||
        `شاهد أنمي ${title} مترجم للعربية على Sanime.`,
      openGraph: {
        title,
        description: anime.description?.slice(0, 160),
        images: anime.coverImage ? [{ url: anime.coverImage }] : undefined,
      },
    };
  } catch {
    return { title: "أنمي غير موجود" };
  }
}

export default async function AnimePage({ params }: Props) {
  const { slug } = await params;

  let anime, relations, episodes, external;
  try {
    const res = await getAnime(slug);
    anime = res.anime;
    relations = res.relations;
  } catch {
    notFound();
  }

  const [epsRes, extRes] = await Promise.allSettled([
    getEpisodeMeta(slug),
    getExternalData(slug),
  ]);
  episodes = epsRes.status === "fulfilled" ? epsRes.value : [];
  external = extRes.status === "fulfilled" ? extRes.value : {};

  const title = displayTitle(anime);
  const cover = optimizeImage(anime.r2CoverImage || anime.coverImage, 600);
  const banner = optimizeImage(
    anime.r2BannerImage || anime.bannerImage || anime.r2CoverImage || anime.coverImage,
    1600
  );
  const ongoing = (anime.status || "").toLowerCase() === "ongoing";
  const published = anime.publishedEpisodes ?? anime.episodes ?? 0;
  const lastEp = episodes.length > 0 ? episodes[episodes.length - 1].number : 0;
  const watchHref =
    published > 0 ? `/watch/${slug}/${lastEp || 1}` : `/anime/${slug}`;

  return (
    <div>
      {/* Banner */}
      <div className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0">
          <Image
            src={banner}
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover object-top opacity-25 grayscale blur-md"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/50" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-10 pt-10 sm:px-6 md:flex-row md:items-end">
          {/* Poster */}
          <div className="relative h-72 w-52 shrink-0 self-center overflow-hidden rounded-3xl border border-white/15 shadow-[0_30px_80px_-30px_rgba(0,0,0,1)] md:self-auto">
            <Image
              src={cover}
              alt={title}
              fill
              priority
              sizes="208px"
              className="object-cover"
            />
            {anime.rating > 0 && (
              <span className="chip absolute start-2 top-2">
                <Star className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
                {toArabicDigits(anime.rating)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 animate-fade-up">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`chip ${ongoing ? "chip-active" : ""}`}>
                {statusLabel(anime.status)}
              </span>
              <span className="chip">{typeLabel(anime.type) || "أنمي"}</span>
              {anime.ageRating?.label && (
                <span className="chip">{anime.ageRating.label}</span>
              )}
            </div>

            <h1 className="text-2xl font-bold leading-tight text-white sm:text-4xl">
              {title}
            </h1>
            {anime.titleEnglish && anime.titleEnglish !== anime.title && (
              <p className="mt-1.5 text-sm text-white/45" dir="ltr">
                {anime.titleEnglish}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
              {anime.year && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-white/40" />
                  {toArabicDigits(anime.year)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <ListVideo className="h-4 w-4 text-white/40" />
                {toArabicDigits(published)} حلقة
              </span>
              {anime.episodeDuration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-white/40" />
                  {anime.episodeDuration}
                </span>
              )}
              {anime.studio && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-white/40" />
                  {anime.studio}
                </span>
              )}
              {anime.author && (
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-white/40" />
                  {anime.author}
                </span>
              )}
            </div>

            {anime.genres.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {anime.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/anime?genres=${encodeURIComponent(g)}`}
                    className="chip hover:bg-white/14"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {anime.description && (
              <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-8 text-white/65">
                {anime.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={watchHref}
                className="btn btn-lg btn-solid btn-sheen"
              >
                <Play className="h-4 w-4 fill-black" strokeWidth={0} />
                {published > 0
                  ? `شاهد الحلقة ${toArabicDigits(lastEp || 1)}`
                  : "قريباً"}
              </Link>
              <TrailerButton url={anime.trailerUrl} />
              {anime.malUrl && (
                <a
                  href={anime.malUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  MyAnimeList ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {/* Episodes */}
        <div className="glass-panel mt-10 p-5 sm:p-7">
          <h2 className="mb-5 flex items-center gap-2.5 text-lg font-bold text-white">
            <span className="glass grid h-9 w-9 place-items-center rounded-2xl">
              <ListVideo className="h-4 w-4" />
            </span>
            الحلقات
          </h2>
          <EpisodeGrid slug={slug} episodes={episodes} />
        </div>

        {/* Characters */}
        {external.characters && external.characters.length > 0 && (
          <Section title="الشخصيات" icon={<Users className="h-4 w-4" />}>
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {external.characters.slice(0, 20).map((c) => (
                <div
                  key={c.id}
                  className="w-28 shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035]"
                >
                  <div className="relative aspect-[3/4]">
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-white/25">
                        ?
                      </div>
                    )}
                  </div>
                  <p className="truncate p-2 text-center text-xs font-medium text-white/70">
                    {c.name}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Relations */}
        {relations.length > 0 && (
          <Section title="أعمال ذات صلة" icon={<Star className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {relations.map((r) => (
                <AnimeCard key={r._id} anime={r} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
