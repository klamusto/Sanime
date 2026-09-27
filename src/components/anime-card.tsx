import Link from "next/link";
import Image from "next/image";
import { Play, Star } from "lucide-react";
import type { Anime } from "@/lib/types";
import {
  displayTitle,
  optimizeImage,
  statusLabel,
  toArabicDigits,
  typeLabel,
} from "@/lib/format";

export default function AnimeCard({
  anime,
  priority,
}: {
  anime: Anime;
  priority?: boolean;
}) {
  const cover = optimizeImage(anime.r2CoverImage || anime.coverImage, 480);
  const ongoing = (anime.status || "").toLowerCase() === "ongoing";

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="card-hover group relative block overflow-hidden rounded-3xl border border-white/8 bg-white/[0.035]"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt={displayTitle(anime)}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 45vw"
            className="object-cover grayscale-[15%] transition duration-700 group-hover:scale-[1.07] group-hover:grayscale-0"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-white/5 text-white/25">
            <Play className="h-10 w-10" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

        {/* top badges */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <span className={`chip ${ongoing ? "chip-active" : ""}`}>
            {statusLabel(anime.status)}
          </span>
          <span className="chip">
            {typeLabel(anime.type) ||
              (anime.year ? toArabicDigits(anime.year) : "")}
          </span>
        </div>

        {/* hover play */}
        <div className="absolute inset-0 grid place-items-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="glass grid h-14 w-14 scale-75 place-items-center rounded-full transition duration-300 group-hover:scale-100">
            <Play
              className="h-6 w-6 translate-x-0.5 fill-white text-white"
              strokeWidth={0}
            />
          </span>
        </div>

        {/* episode count */}
        <div className="absolute bottom-2.5 end-2.5">
          <span className="chip">
            {toArabicDigits(anime.publishedEpisodes ?? anime.episodes ?? 0)} حلقة
          </span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug text-white/90 transition group-hover:text-white">
          {displayTitle(anime)}
        </h3>
        <div className="mt-2 flex items-center justify-between text-xs text-white/40">
          <span>{anime.year ? toArabicDigits(anime.year) : "—"}</span>
          {anime.rating > 0 ? (
            <span className="flex items-center gap-1 text-white/70">
              <Star className="h-3.5 w-3.5 fill-white" strokeWidth={0} />
              {toArabicDigits(anime.rating)}
            </span>
          ) : (
            <span className="line-clamp-1 max-w-[60%]">
              {anime.genres?.[0] ?? ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
