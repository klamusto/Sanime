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
      className="card-hover group flex gap-3 rounded-2xl border border-edge bg-card p-3"
    >
      <div className="relative h-24 w-[4.6rem] shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-[5.4rem]">
        {cover ? (
          <Image
            src={cover}
            alt={displayTitle(ep.animeId)}
            fill
            priority={priority}
            sizes="90px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-card-hover text-slate-600">
            <Play className="h-6 w-6" />
          </div>
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent pb-1 pt-4 text-center text-[11px] font-bold text-white">
          {ep.title || `الحلقة ${toArabicDigits(ep.number)}`}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-100 transition group-hover:text-primary-soft">
            {displayTitle(ep.animeId)}
          </h3>
          <p className="mt-1.5 text-xs font-medium text-primary-soft/90">
            {ep.title || `الحلقة ${toArabicDigits(ep.number)}`}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span>{timeAgo(ep.createdAt)}</span>
          {(ep.views ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatCount(ep.views)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
