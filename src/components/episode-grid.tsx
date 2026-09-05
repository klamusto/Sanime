"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import type { EpisodeMeta } from "@/lib/types";
import { toArabicDigits } from "@/lib/format";

const CHUNK = 48;

export default function EpisodeGrid({
  slug,
  episodes,
}: {
  slug: string;
  episodes: EpisodeMeta[];
}) {
  const [newestFirst, setNewestFirst] = useState(true);
  const [limit, setLimit] = useState(CHUNK);

  const ordered = useMemo(() => {
    const list = [...episodes];
    if (newestFirst) list.reverse();
    return list;
  }, [episodes, newestFirst]);

  const visible = ordered.slice(0, limit);
  const watched = new Set<string>(); // can be extended with localStorage later

  if (episodes.length === 0) {
    return (
      <p className="rounded-2xl border border-edge bg-card p-8 text-center text-sm text-slate-500">
        لا توجد حلقات منشورة حتى الآن.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {toArabicDigits(episodes.length)} حلقة
          {episodes.some((e) => e.isFiller) && " · يتضمن حلقات فيلر"}
        </p>
        <button
          onClick={() => {
            setNewestFirst((v) => !v);
            setLimit(CHUNK);
          }}
          className="rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-primary/50 hover:text-white"
        >
          {newestFirst ? "↓ الأحدث أولاً" : "↑ الأقدم أولاً"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {visible.map((ep) => {
          const isWatched = watched.has(ep._id);
          return (
            <Link
              key={ep._id}
              href={`/watch/${slug}/${ep.number}`}
              className={`group relative flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                isWatched
                  ? "border-primary/40 bg-primary/15 text-primary-soft"
                  : "border-edge bg-card text-slate-200 hover:border-primary/60 hover:bg-primary/10 hover:text-white"
              }`}
              title={ep.title}
            >
              {toArabicDigits(ep.number)}
              {ep.isFiller && (
                <span className="absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
              <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl bg-primary/80 opacity-0 transition group-hover:opacity-100">
                <Play className="h-3.5 w-3.5 fill-white text-white" strokeWidth={0} />
              </span>
            </Link>
          );
        })}
      </div>

      {visible.length < ordered.length && (
        <button
          onClick={() => setLimit((l) => l + CHUNK)}
          className="mx-auto mt-5 block rounded-xl border border-edge bg-card px-8 py-2.5 text-sm font-medium text-slate-300 transition hover:border-primary/50 hover:text-white"
        >
          عرض المزيد ({toArabicDigits(ordered.length - visible.length)} متبقية)
        </button>
      )}
    </div>
  );
}
