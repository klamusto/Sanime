"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Play, Trash2 } from "lucide-react";
import Section from "@/components/section";
import {
  progressServerSnapshot,
  progressSnapshot,
  removeProgress,
  subscribeProgress,
} from "@/lib/progress";
import { optimizeImage, toArabicDigits } from "@/lib/format";

export default function ContinueWatching() {
  const all = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    progressServerSnapshot
  );
  const items = all.slice(0, 8);

  if (items.length === 0) return null;

  return (
    <Section title="تابع مشاهدتك" icon={<Play className="h-4 w-4" />}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => {
        const pct =
          p.duration > 0
            ? Math.min(100, Math.round((p.time / p.duration) * 100))
            : 0;
        return (
          <div key={p.slug} className="group relative">
            <Link
              href={`/watch/${p.slug}/${p.ep}`}
              className="card-hover relative block overflow-hidden rounded-3xl border border-white/8 bg-white/[0.035]"
            >
              <div className="relative aspect-video">
                {p.coverImage ? (
                  <Image
                    src={optimizeImage(p.coverImage, 480)}
                    alt={p.animeArabic || p.animeTitle}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover grayscale-[20%] transition duration-500 group-hover:grayscale-0"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-white/5 text-white/25">
                    <Play className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100" />
                <span className="glass absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full opacity-0 transition group-hover:opacity-100">
                  <Play
                    className="h-5 w-5 translate-x-px fill-white text-white"
                    strokeWidth={0}
                  />
                </span>
                {/* progress bar */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
                  <div className="h-full bg-white" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="p-3">
                <h3 className="truncate text-sm font-semibold text-white/90">
                  {p.animeArabic || p.animeTitle}
                </h3>
                <p className="mt-0.5 text-xs text-white/40">
                  الحلقة {toArabicDigits(p.ep)}
                  {pct > 0 && pct < 97 && ` · ${toArabicDigits(pct)}%`}
                </p>
              </div>
            </Link>
            <button
              onClick={() => removeProgress(p.slug)}
              className="btn btn-icon-sm absolute end-2 top-2 z-10 opacity-0 transition group-hover:opacity-100"
              aria-label="إزالة من المتابعة"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          );
        })}
      </div>
    </Section>
  );
}
