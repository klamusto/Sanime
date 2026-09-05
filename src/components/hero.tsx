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
      className="relative overflow-hidden rounded-3xl border border-edge"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* background */}
      <div className="absolute inset-0">
        {bg && (
          <Image
            src={optimizeImage(bg, 1400)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover object-top opacity-40 blur-sm"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-transparent to-bg/60" />
        <div className="aurora opacity-60" aria-hidden />
      </div>

      <div className="relative grid min-h-[430px] items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14">
        {/* text */}
        <div key={item._id} className="max-w-2xl animate-fade-up">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary-soft">
              <Sparkles className="h-3.5 w-3.5" />
              مختارات سانيمي
            </span>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              {statusLabel(item.status)}
            </span>
          </div>

          <h1 className="text-2xl font-bold leading-tight text-white sm:text-4xl">
            {displayTitle(item)}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            {item.year && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {toArabicDigits(item.year)}
              </span>
            )}
            <span>الحلقة {toArabicDigits(item.episodeNumber)}</span>
            {(item.rating ?? 0) > 0 && <span>★ {toArabicDigits(item.rating ?? 0)}</span>}
          </div>

          <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-7 text-slate-300">
            {item.description}
          </p>

          {item.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {item.genres.slice(0, 5).map((g) => (
                <Link
                  key={g}
                  href={`/anime?genres=${encodeURIComponent(g)}`}
                  className="rounded-full border border-edge bg-surface/70 px-3 py-1 text-[11px] text-slate-300 transition hover:border-primary/50 hover:text-primary-soft"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/watch/${item.animeSlug}/${item.episodeNumber}`}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-l from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-xl shadow-primary/35 transition hover:shadow-primary/60 hover:brightness-110"
            >
              <Play className="h-4.5 w-4.5 fill-white transition group-hover:scale-110" />
              شاهد الآن
            </Link>
            <Link
              href={`/anime/${item.animeSlug}`}
              className="flex items-center gap-2 rounded-xl border border-edge bg-surface/70 px-6 py-3 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-primary/50 hover:text-white"
            >
              <Info className="h-4.5 w-4.5" />
              التفاصيل
            </Link>
          </div>
        </div>

        {/* poster */}
        <div className="hidden lg:block">
          <div className="relative h-80 w-56 animate-float overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60">
            <Image
              key={item._id}
              src={optimizeImage(item.coverImage, 600)}
              alt={displayTitle(item)}
              fill
              priority
              sizes="224px"
              className="object-cover animate-fade-in"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-10 text-center">
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
              className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === active
                  ? "border-primary shadow-lg shadow-primary/40"
                  : "border-transparent opacity-50 hover:opacity-90"
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
