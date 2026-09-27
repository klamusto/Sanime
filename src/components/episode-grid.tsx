"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownUp, Play } from "lucide-react";
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

  if (episodes.length === 0) {
    return (
      <p className="glass-panel p-8 text-center text-sm text-white/45">
        لا توجد حلقات منشورة حتى الآن.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/50">
          {toArabicDigits(episodes.length)} حلقة
          {episodes.some((e) => e.isFiller) && " · يتضمن حلقات فيلر"}
        </p>
        <button
          onClick={() => {
            setNewestFirst((v) => !v);
            setLimit(CHUNK);
          }}
          className="btn btn-sm"
        >
          <ArrowDownUp className="h-3.5 w-3.5" />
          {newestFirst ? "الأحدث أولاً" : "الأقدم أولاً"}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {visible.map((ep) => (
          <Link
            key={ep._id}
            href={`/watch/${slug}/${ep.number}`}
            className="group relative flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/80 transition hover:border-white/40 hover:bg-white hover:text-black"
            title={ep.title}
          >
            {toArabicDigits(ep.number)}
            {ep.isFiller && (
              <span className="absolute end-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white/50 group-hover:bg-black/40" />
            )}
            <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl opacity-0 transition group-hover:opacity-100">
              <Play className="h-3.5 w-3.5 fill-black text-black" strokeWidth={0} />
            </span>
          </Link>
        ))}
      </div>

      {visible.length < ordered.length && (
        <button
          onClick={() => setLimit((l) => l + CHUNK)}
          className="btn mx-auto mt-5 block"
        >
          عرض المزيد ({toArabicDigits(ordered.length - visible.length)} متبقية)
        </button>
      )}
    </div>
  );
}
