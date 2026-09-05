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

export default function AnimeCard({ anime, priority }: { anime: Anime; priority?: boolean }) {
  const cover = optimizeImage(
    anime.r2CoverImage || anime.coverImage,
    480
  );
  const ongoing = (anime.status || "").toLowerCase() === "ongoing";

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className="card-hover group relative block overflow-hidden rounded-2xl border border-edge bg-card"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {cover ? (
          <Image
            src={cover}
            alt={displayTitle(anime)}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 45vw"
            className="object-cover transition duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-card to-surface text-slate-600">
            <Play className="h-10 w-10" />
          </div>
        )}

        {/* top badges */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <span
            className={`rounded-md px-2 py-0.5 text-[11px] font-semibold backdrop-blur ${
              ongoing
                ? "bg-emerald-500/85 text-emerald-50"
                : "bg-primary/80 text-white"
            }`}
          >
            {statusLabel(anime.status)}
          </span>
          <span className="rounded-md bg-black/55 px-2 py-0.5 text-[11px] font-medium text-slate-200 backdrop-blur">
            {typeLabel(anime.type) || (anime.year ? toArabicDigits(anime.year) : "")}
          </span>
        </div>

        {/* hover play */}
        <div className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="grid h-14 w-14 scale-75 place-items-center rounded-full bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/40 transition duration-300 group-hover:scale-100">
            <Play className="h-6 w-6 fill-white text-white" strokeWidth={0} />
          </span>
        </div>

        {/* episode count */}
        <div className="absolute bottom-2.5 end-2.5 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-medium text-slate-200 backdrop-blur">
          {toArabicDigits(anime.publishedEpisodes ?? anime.episodes ?? 0)} حلقة
        </div>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-semibold leading-snug text-slate-100 transition group-hover:text-primary-soft">
          {displayTitle(anime)}
        </h3>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{anime.year ? toArabicDigits(anime.year) : "—"}</span>
          {anime.rating > 0 ? (
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
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
