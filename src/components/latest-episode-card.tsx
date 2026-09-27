import Link from "next/link";
import Image from "next/image";
import { Eye, Play } from "lucide-react";
import type { LatestEpisode } from "@/lib/types";
import {
  displayTitle,
  formatCount,
  optimizeImage,
  timeAgo,
  toArabicDigits,
} from "@/lib/format";

export default function LatestEpisodeCard({
  ep,
  priority,
}: {
  ep: LatestEpisode;
  priority?: boolean;
}) {
  const cover = optimizeImage(ep.animeId.coverImage, 480);

  return (
    <Link
      href={`/watch/${ep.animeId.slug}/${ep.number}`}
      className="card-hover group flex gap-3 rounded-3xl border border-white/8 bg-white/[0.035] p-3"
    >
      <div className="relative h-24 w-[4.6rem] shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-[5.4rem]">
        {cover ? (
          <Image
            src={cover}
            alt={displayTitle(ep.animeId)}
            fill
            priority={priority}
            sizes="90px"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-white/5 text-white/25">
            <Play className="h-6 w-6" />
          </div>
        )}
        <span className="absolute inset-0 grid place-items-center bg-black/45 opacity-0 transition group-hover:opacity-100">
          <span className="glass grid h-9 w-9 place-items-center rounded-full">
            <Play
              className="h-4 w-4 translate-x-px fill-white text-white"
              strokeWidth={0}
            />
          </span>
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white/90 transition group-hover:text-white">
            {displayTitle(ep.animeId)}
          </h3>
          <p className="mt-1.5 text-xs font-medium text-white/50">
            {ep.title || `الحلقة ${toArabicDigits(ep.number)}`}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/35">
          <span>{timeAgo(ep.createdAt)}</span>
          {(ep.views ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatCount(ep.views)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
