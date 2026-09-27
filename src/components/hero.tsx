"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Info, Play, Sparkles } from "lucide-react";
import type { FeaturedItem } from "@/lib/types";
import {
  displayTitle,
  optimizeImage,
  statusLabel,
  toArabicDigits,
} from "@/lib/format";

export default function Hero({ items }: { items: FeaturedItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = items.length;

  const go = useCallback(
    (i: number) => setActive(((i % count) + count) % count),
    [count]
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    timer.current = setInterval(() => {
      setActive((a) => (a + 1) % count);
    }, 7000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, count]);

  if (count === 0) return null;

  const item = items[active];
  const bg = item.bannerImage || item.coverImage;

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-white/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* background */}
      <div className="absolute inset-0">
        {bg && (
          <Image
            key={bg}
            src={optimizeImage(bg, 1400)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover object-top opacity-35 grayscale"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-transparent to-black/70" />
      </div>

      <div className="relative grid min-h-[26rem] items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14">
        {/* text */}
        <div key={item._id} className="max-w-2xl animate-fade-up">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="chip chip-active">
              <Sparkles className="h-3.5 w-3.5" />
              مختارات سانيمي
            </span>
            <span className="chip">{statusLabel(item.status)}</span>
          </div>

          <h1 className="text-2xl font-bold leading-tight text-white sm:text-4xl">
            {displayTitle(item)}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
            {item.year && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {toArabicDigits(item.year)}
              </span>
            )}
            <span>الحلقة {toArabicDigits(item.episodeNumber)}</span>
            {(item.rating ?? 0) > 0 && (
              <span>★ {toArabicDigits(item.rating ?? 0)}</span>
            )}
          </div>

          <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-7 text-white/60">
            {item.description}
          </p>

          {item.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.genres.slice(0, 5).map((g) => (
                <Link
                  key={g}
                  href={`/anime?genres=${encodeURIComponent(g)}`}
                  className="chip hover:bg-white/15"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/watch/${item.animeSlug}/${item.episodeNumber}`}
              className="btn btn-lg btn-solid btn-sheen group"
            >
              <Play
                className="h-4 w-4 fill-black transition group-hover:scale-110"
                strokeWidth={0}
              />
              شاهد الآن
            </Link>
            <Link href={`/anime/${item.animeSlug}`} className="btn btn-lg">
              <Info className="h-4 w-4" />
              التفاصيل
            </Link>
          </div>
        </div>

        {/* poster */}
        <div className="hidden lg:block">
          <div className="relative h-80 w-56 overflow-hidden rounded-3xl border border-white/15 shadow-[0_30px_80px_-30px_rgba(0,0,0,1)]">
            <Image
              key={item._id}
              src={optimizeImage(item.coverImage, 600)}
              alt={displayTitle(item)}
              fill
              priority
              sizes="224px"
              className="object-cover animate-fade-in"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-3 pt-10 text-center">
              <span className="text-xs font-bold text-white">
                الحلقة {toArabicDigits(item.episodeNumber)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* thumbnails */}
      {count > 1 && (
        <div className="relative z-10 flex gap-2.5 overflow-x-auto no-scrollbar px-6 pb-5 sm:px-10 lg:px-14">
          {items.map((it, i) => (
            <button
              key={it._id}
              onClick={() => go(i)}
              className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-xl border transition ${
                i === active
                  ? "border-white opacity-100"
                  : "border-white/10 opacity-40 hover:opacity-80"
              }`}
              aria-label={displayTitle(it)}
            >
              <Image
                src={optimizeImage(it.coverImage, 160)}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
