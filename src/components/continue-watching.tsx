"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, Trash2 } from "lucide-react";
import { getProgress, removeProgress, type WatchProgress } from "@/lib/progress";
import { optimizeImage, toArabicDigits } from "@/lib/format";

export default function ContinueWatching() {
  const [items, setItems] = useState<WatchProgress[]>([]);

  useEffect(() => {
    const all = Object.values(getProgress()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
    setItems(all.slice(0, 8));
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => {
        const pct =
          p.duration > 0 ? Math.min(100, Math.round((p.time / p.duration) * 100)) : 0;
        return (
          <div key={p.slug} className="group relative">
            <Link
              href={`/watch/${p.slug}/${p.ep}`}
              className="card-hover relative block overflow-hidden rounded-2xl border border-edge bg-card"
            >
              <div className="relative aspect-video">
                {p.coverImage ? (
                  <Image
                    src={optimizeImage(p.coverImage, 480)}
                    alt={p.animeArabic || p.animeTitle}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-card-hover text-slate-600">
                    <Play className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/35 opacity-0 transition group-hover:opacity-100" />
                <span className="absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40 opacity-0 transition group-hover:opacity-100">
                  <Play className="h-5 w-5 fill-white text-white" strokeWidth={0} />
                </span>
                {/* progress bar */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
                  <div
                    className="h-full bg-gradient-to-l from-primary to-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="p-3">
                <h3 className="truncate text-sm font-semibold text-slate-100">
                  {p.animeArabic || p.animeTitle}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  الحلقة {toArabicDigits(p.ep)}
                  {pct > 0 && pct < 97 && ` · ${toArabicDigits(pct)}%`}
                </p>
              </div>
            </Link>
            <button
              onClick={() => {
                removeProgress(p.slug);
                setItems((prev) => prev.filter((x) => x.slug !== p.slug));
              }}
              className="absolute end-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg bg-black/60 text-slate-300 opacity-0 backdrop-blur transition hover:text-red-400 group-hover:opacity-100"
              aria-label="إزالة من المتابعة"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
